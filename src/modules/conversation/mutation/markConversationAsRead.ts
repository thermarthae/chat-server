import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID
} from 'graphql';

import ConversationModel from '../ConversationModel';
import { checkUserRightsToConv, checkIfNoSessionOwnerErr } from '../../../utils/access.utils';
import { IRootValue, IContext } from '../../../server';
import { determineRealConvId } from '../../../utils/conversation.utils';
import conversationType from '../ConversationType';

export const markConversationAsRead: GraphQLFieldConfig<IRootValue, IContext, { conversationId: string }> = {
	type: new GraphQLNonNull(conversationType),
	description: 'Mark given conversation as read',
	args: {
		conversationId: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation Id'
		},
	},
	resolve: async ({ }, { conversationId }, { sessionOwner, convIDLoader }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		const realConvID = await determineRealConvId(conversationId, verifiedUser._id);
		const { users } = await checkUserRightsToConv(realConvID, verifiedUser, convIDLoader);

		const updatedConv = await ConversationModel.findByIdAndUpdate(
			realConvID,
			{ $set: { 'seen.$[s].time': new Date() } },
			{
				new: true,
				arrayFilters: [{ 's.user': verifiedUser._id }]
			}
		).lean();

		return Object.assign({}, updatedConv, { users });
	}
};
