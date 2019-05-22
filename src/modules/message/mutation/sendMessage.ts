import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,

} from 'graphql';
import { UserInputError } from 'apollo-server-core';

import ConversationModel, { IConversation } from '../../conversation/ConversationModel';
import MessageModel from '../MessageModel';
import pubSub from '../../../pubSub';
import MessageType from '../MessageType';
import { checkUserRightsToConv, checkIfNoSessionOwnerErr } from '../../../utils/access.utils';
import { IRootValue, IContext } from '../../../server';
import { determineRealConvId } from '../../../utils/conversation.utils';

interface ISendMessageArgs {
	conversationId: string;
	message: string;
}
export const sendMessage: GraphQLFieldConfig<IRootValue, IContext, ISendMessageArgs> = {
	type: new GraphQLNonNull(MessageType),
	description: 'Send message in given conversation',
	args: {
		conversationId: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation Id'
		},
		message: {
			type: new GraphQLNonNull(GraphQLString),
			description: 'Your message'
		}
	},
	resolve: async ({ }, { conversationId, message }, { sessionOwner, convIDLoader }) => {
		if (!message || message.length < 1) throw new UserInputError('Message could not be empty');
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		const realConvID = await determineRealConvId(conversationId, verifiedUser._id);
		const oldConversation = await checkUserRightsToConv(realConvID, verifiedUser, convIDLoader);

		const time = new Date();
		const newMessage = new MessageModel({
			author: verifiedUser._id,
			conversation: realConvID,
			time,
			content: message,
		});

		const [{ users, significantlyUpdatedAt, draft, seen }] = await Promise.all([
			ConversationModel.findByIdAndUpdate(
				realConvID,
				{
					$push: { messages: newMessage._id },
					$set: {
						'significantlyUpdatedAt': time,
						'draft.$[d].content': '',
						'seen.$[s].time': time,
					}
				},
				{
					new: true,
					arrayFilters: [{ 's.user': verifiedUser._id }, { 'd.user': verifiedUser._id }]
				} as any
			) as any as IConversation,
			newMessage.save()
		]);

		const updatedConv = Object.assign(oldConversation, {
			significantlyUpdatedAt,
			seen,
			draft,
		});
		const parsedMessage = Object.assign(newMessage.toObject(), {
			me: true,
			author: verifiedUser
		});

		pubSub.publish('newMessageAdded', {
			authorizedUsers: users,
			conversation: updatedConv,
			message: parsedMessage
		});
		return parsedMessage;
	}
};
