import { GraphQLString, GraphQLNonNull, GraphQLFieldConfig, GraphQLList } from 'graphql';
import { UserInputError } from 'apollo-server-core';
import { IRootValue, IContext } from '../../../server';
import ConversationType from '../ConversationType';
import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';
import ConversationModel from '../ConversationModel';

export const findConversation: GraphQLFieldConfig<IRootValue, IContext, { query: string }> = {
	type: new GraphQLNonNull(new GraphQLList(ConversationType)),
	description: 'Find conversation',
	args: { query: { type: new GraphQLNonNull(GraphQLString) } },
	resolve: async ({ }, { query }, { sessionOwner }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		if (query.length < 3) throw new UserInputError('Query must be at least 3 characters long');
		return await ConversationModel.aggregate([
			// Copy of getUserConversations aggregation
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
			{ $lookup: { from: 'User', localField: 'messages.author', foreignField: '_id', as: 'messages.author' } },
			{ $unwind: '$messages.author' },
			{ $lookup: { from: 'User', localField: 'users', foreignField: '_id', as: 'users' } },
			//
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
