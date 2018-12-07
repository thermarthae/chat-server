import { GraphQLFieldConfig } from 'graphql';
import { IRootValue, IContext } from '../../../server';
import UserConversationsType from '../UserConversationsType';
import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';
import ConversationModel from '../ConversationModel';

export const userConversations: GraphQLFieldConfig<IRootValue, IContext> = {
	type: UserConversationsType,
	description: 'Get current user conversations',
	resolve: async ({ }, { }, { sessionOwner }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
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
					draftCount: {
						$sum: {
							$cond: {
								if: { $and: ['$draft.content', { $ne: ['$draft.content', ''] }], }, then: 1, else: 0
							}
						}
					},
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
		if (!result[0]) return {
			conversationArr: [],
			conversationCount: 0,
			draftCount: 0,
			unreadCount: 0,
		};
		return result[0];
	}
};
