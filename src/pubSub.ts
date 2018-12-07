import { PubSub } from 'graphql-subscriptions';

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
const pubSub = new PubSub();
export default pubSub;
