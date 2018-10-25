import {
	GraphQLID,
	GraphQLString,
	GraphQLNonNull,
	GraphQLFieldConfig,
	GraphQLList
} from 'graphql';

import { IRootValue, IContext } from '../../';
import { conversationType, userConversationsType } from '../types/conversation.types';
import { checkIfNoSessionOwnerErr, checkUserRightsToConv } from '../../utils/access.utils';
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
	resolve: async ({ }, { id }, { sessionOwner, convIDLoader }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		return await checkUserRightsToConv(id, verifiedUser, convIDLoader);
	}
};

export const findConversation: GraphQLFieldConfig<IRootValue, IContext> = {
	type: new GraphQLList(conversationType),
	description: 'Find conversation',
	args: { query: { type: GraphQLString } },
	resolve: async ({ }, { query }, { sessionOwner }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		if (query.length < 3) throw new Error('Query must be at least 3 characters long');
		return await ConversationModel.aggregate([
			{ $match: { users: verifiedUser._id } },
			{
				$addFields: {
					messages: { $slice: ['$messages', -1] },
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
			{ $unwind: '$messages' },
			{ $lookup: { from: 'User', localField: 'users', foreignField: '_id', as: 'users' } },
			{
				$match: {
					$or: [
						{ name: { $regex: query, $options: 'i' } },
						{ 'messages.content': { $regex: query, $options: 'i' } },
						{ 'users.name': { $regex: query, $options: 'i' } }
					]
				}
			},
			{ $addFields: { messages: ['$messages'] } },
		]).cache(10);
	}
};

export const userConversations: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userConversationsType,
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
		if (!result[0]) return {
			conversationArr: [],
			conversationCount: 0,
			draftCount: 0,
			unreadCount: 0,
		};
		return result[0];
	}
};
