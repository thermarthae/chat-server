import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from 'graphql';
import { pubsub } from '../';
import { withFilter } from 'graphql-subscriptions';

import { messageType } from '../types/conversation.types';

export const messageAdded: GraphQLFieldConfig<any, any, any> = {
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
	resolve: async (payload, b: any, { currentUser }: any) => {
		if (payload.authorizedUsers.includes(currentUser._id))
			return payload.messageAdded;
		throw new Error('No access');
	}
};
