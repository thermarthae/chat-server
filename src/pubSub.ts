import { PubSub } from 'graphql-subscriptions';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import * as RedisClient from 'ioredis';

const options = {
	host: process.env.REDIS_ADDRESS!,
	port: parseInt(process.env.REDIS_PORT!)
};

const pubSub = process.env.NODE_ENV !== 'production'
	? new PubSub()
	: new RedisPubSub({
		publisher: new RedisClient(options),
		subscriber: new RedisClient(options)
	});

// HACK: PubSub have a different types than RedisPubSub
export default pubSub as PubSub & Partial<RedisPubSub>;
