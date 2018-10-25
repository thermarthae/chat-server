import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { PubSub } from 'graphql-subscriptions';

import queries from './queries';
import mutations from './mutations';
import subscriptions from './subscriptions';

/**
 * Note that the default PubSub implementation is intended for demo purposes.
 * It only works if you have a single instance of your server and doesn't scale beyond a couple of connections.
 * For production usage you'll want to use one of the PubSub implementations backed by an external store.
 *
 * If possble memory leak warning: (pubsub as any).ee.setMaxListeners(30);
 *
 * //TODO: Replace with graphql-redis-subscriptions or graphql-mqtt-subscriptions
 * https://github.com/davidyaha/graphql-mqtt-subscriptions
 * https://github.com/davidyaha/graphql-redis-subscriptions
 */
export const pubsub = new PubSub();

export default new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		fields: {
			...queries
		} as any
	}),
	mutation: new GraphQLObjectType({
		name: 'Mutation',
		fields: {
			...mutations
		} as any
	}),
	subscription: new GraphQLObjectType({
		name: 'Subscription',
		fields: {
			...subscriptions
		} as any
	})
});
