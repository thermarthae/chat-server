import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from 'graphql';
import { pubsub } from '../';
import { withFilter } from 'graphql-subscriptions';

import { IContext } from '../../';
import { messageType } from '../types/conversation.types';

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
		(payload, variables) => {
			return payload.conversationId === variables.conversationId;
		}
	),
	resolve: async (payload, {}, { verifiedToken }) => {
		console.log('verifiedToken on conversation.subscription', verifiedToken);
		if (payload.authorizedUsers.includes(verifiedToken!.sub)) return payload.messageAdded;
		throw new Error('No access');
	}
};
