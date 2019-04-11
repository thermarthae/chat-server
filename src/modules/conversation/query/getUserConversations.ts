import { GraphQLFieldConfig, GraphQLList, GraphQLNonNull } from 'graphql';
import { IRootValue, IContext } from '../../../server';
import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';
import ConversationModel from '../ConversationModel';
import ConversationType from '../ConversationType';

export const getUserConversations: GraphQLFieldConfig<IRootValue, IContext> = {
	type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ConversationType))),
	description: 'Get current user conversations. Return only last message - all args are omitted (cursor, skip, ...)',
	resolve: async ({ }, { }, { sessionOwner }) => {
		// findConversation is using almost the same aggregation
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		const result = await ConversationModel.aggregate([
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
			{ $addFields: { messages: ['$messages'] } },
			{ $lookup: { from: 'User', localField: 'users', foreignField: '_id', as: 'users' } },
		]).cache(10);
		return result;
	}
};
