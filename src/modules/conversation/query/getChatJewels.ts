import { GraphQLFieldConfig } from 'graphql';
import { IRootValue, IContext } from '../../../server';
import ChatJewelsType from '../ChatJewelsType';
import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';
import ConversationModel from '../ConversationModel';

export const getChatJewels: GraphQLFieldConfig<IRootValue, IContext> = {
	type: ChatJewelsType,
	description: 'Get count data of user conversations',
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
			{
				$group: {
					_id: null,
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
		return result[0] || {
			conversationCount: 0,
			draftCount: 0,
			unreadCount: 0,
		};
	}
};
