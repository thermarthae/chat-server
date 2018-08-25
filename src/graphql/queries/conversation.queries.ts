import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLFieldConfig,
} from 'graphql';

import { IRootValue, IContext } from '../../';
import { conversationType, userConversationsType } from '../types/conversation.types';
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

export const userConversations: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userConversationsType,
	description: 'Get current user conversations',
	resolve: async ({ }, { }, { tokenOwner }) => {
		const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
		const result = await ConversationModel.aggregate([
			{ $match: { users: verifiedUser._id } },
			{
				$addFields: {
					draft: {
						$arrayElemAt: [{
							$filter: { input: '$draft', cond: { $eq: ['$$this.user', verifiedUser._id] } }
						}, 0]
					},
					seen: {
						$arrayElemAt: [{
							$filter: { input: '$seen', cond: { $eq: ['$$this.user', verifiedUser._id] } }
						}, 0]
					}
				}
			},
			{ $lookup: { from: 'Message', localField: 'messages', foreignField: '_id', as: 'messages' } },
			{ $lookup: { from: 'User', localField: 'users', foreignField: '_id', as: 'users' } },
			{
				$group: {
					_id: null,
					conversationArr: { $push: '$$ROOT' },
					conversationCount: { $sum: 1 },
					draftCount: { $sum: { $cond: { if: { $ne: ['$draft.content', ''] }, then: 1, else: 0 } } },
					unreadCount: {
						$sum: {
							$cond: {
								if: { $gt: [{ $arrayElemAt: ['$messages.time', -1] }, '$seen.time'] }, then: 1, else: 0
							}
						}
					},
				},
			}
		]).cache(10);
		if (!result[0]) throw new Error('404 (Not Found)');
		return result[0];
	}
};
