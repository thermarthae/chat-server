import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from 'graphql';
import { pubsub } from '../';
import { withFilter } from 'graphql-subscriptions';

import { IContext } from '../../';
import { messageType } from '../types/conversation.types';

import { checkIfNoTokenOwnerErr } from '../../utils/access.utils';
export const messageAdded: GraphQLFieldConfig<any, IContext, any> = {
	type: messageType,
	description: 'Sync messages',
	args: {
		conversationId: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation Id'
		},
	},
	subscribe: withFilter(
		() => pubsub.asyncIterator('messageAdded'),
		(payload, variables) => payload.conversationId === variables.conversationId
	),
	resolve: async (payload, { }, { tokenOwner }) => {
		const verifyToken = checkIfNoTokenOwnerErr(tokenOwner);
		const condition = payload.authorizedUsers.find((id: string) => String(id) === String(verifyToken!._id));
		if (condition) return payload.message;
		throw new Error('No access');
	}
};
