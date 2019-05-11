import mongoose = require('mongoose');
import cachegoose = require('cachegoose');

export default async (uri?: string) => {
	const isProd = process.env.NODE_ENV === 'production';

	cachegoose(mongoose, {
		engine: isProd ? 'redis' : 'memory',
		port: parseInt(process.env.REDIS_PORT!),
		host: process.env.REDIS_ADDRESS!
	});

	const mongoUri = uri || process.env.MONGODB_URI!;
	await mongoose.connect(mongoUri, { useNewUrlParser: true, useCreateIndex: true });
	return mongoose;
};
