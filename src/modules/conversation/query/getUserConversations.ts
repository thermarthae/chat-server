import { GraphQLFieldConfig, GraphQLList } from 'graphql';
import { IRootValue, IContext } from '../../../server';
import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';
import ConversationModel from '../ConversationModel';
import conversationType from '../ConversationType';

export const getUserConversations: GraphQLFieldConfig<IRootValue, IContext> = {
	type: new GraphQLList(conversationType),
	description: 'Get current user conversations',
	resolve: async ({ }, { }, { sessionOwner }) => {
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
			{ $lookup: { from: 'User', localField: 'users', foreignField: '_id', as: 'users' } }
		]).cache(10);
		return result;
	}
};
