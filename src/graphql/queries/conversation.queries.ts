import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLFieldConfig,
} from 'graphql';

import { IRootValue, IContext } from '../../';
import { conversationType, userConversationsCountType } from '../types/conversation.types';
import { checkIfNoTokenOwnerErr, checkUserRightsToConv } from '../../utils/access.utils';
import ConversationModel from '../../models/conversation';

export const getConversation: GraphQLFieldConfig<IRootValue, IContext> = {
	type: conversationType,
	description: 'Get conversation by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation ID'
		}
	},
	resolve: async ({ }, { id }, { tokenOwner, convIDLoader }) => {
		const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
		return await checkUserRightsToConv(id, verifiedUser, convIDLoader);
	}
};

export const userConversationsCount: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userConversationsCountType,
	description: 'Count of current user conversations',
	resolve: async ({ }, { }, { tokenOwner }) => {
		const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
		const result = await ConversationModel.aggregate(
			[
				{ $match: { users: verifiedUser._id } },
				{
					$project: {
						_id: 0,
						lastMessage: { $arrayElemAt: ['$messages', -1] },
						draft: {
							$filter: { input: '$draft', cond: { $eq: ['$$this.user', verifiedUser._id] } }
						},
						seen: {
							$filter: { input: '$seen', cond: { $eq: ['$$this.user', verifiedUser._id] } }
						}
					}
				},
				{
					$lookup: {
						from: 'Message',
						localField: 'lastMessage',
						foreignField: '_id',
						as: 'lastMessage'
					}
				},
				{
					$project: {
						lastMessage: { $arrayElemAt: ['$lastMessage', 0] },
						draft: { $arrayElemAt: ['$draft', 0] },
						seen: { $arrayElemAt: ['$seen', 0] },
					}
				},
				{
					$project: {
						unread: {
							$cond: { if: { $lt: ['$lastMessage.time', '$seen.time'] }, then: 1, else: 0 }
						},
						draft: {
							$cond: { if: { $ne: ['$draft.content', ''] }, then: 1, else: 0 }
						},
					}
				},
				{
					$group: {
						_id: null,
						conversationCount: { $sum: 1 },
						draftCount: { $sum: '$draft' },
						unreadCount: { $sum: '$unread' },
					}
				},
			]
		);
		if (!result[0]) throw new Error('404 (Not Found)');
		return result[0];
	}
};
