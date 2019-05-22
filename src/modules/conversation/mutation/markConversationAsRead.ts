import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
} from 'graphql';

import ConversationModel from '../ConversationModel';
import { checkUserRightsToConv, checkIfNoSessionOwnerErr } from '../../../utils/access.utils';
import { IRootValue, IContext } from '../../../server';
import { determineRealConvId } from '../../../utils/conversation.utils';

export const markConversationAsRead: GraphQLFieldConfig<IRootValue, IContext, { conversationId: string }> = {
	type: GraphQLString,
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
		await checkUserRightsToConv(realConvID, verifiedUser, convIDLoader);

		const status = await ConversationModel.updateOne(
			{ _id: realConvID },
			{ $set: { 'seen.$[s].time': new Date() } },
			{ arrayFilters: [{ 's.user': verifiedUser._id }] }
		);
		return status.ok === 1 ? 'Success!' : null;
	}
};
