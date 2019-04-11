import initMongoose from '../src/initMongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const initTestMongoose = async () => {
	const mongoServer = new MongoMemoryServer();
	const mongoUri = await mongoServer.getConnectionString();
	const mongoose = await initMongoose(mongoUri);

	return {
		mongoose,
		mongoServer,
		stopMongoose: async () => {
			await mongoose.disconnect();
			await mongoServer.stop();
		}
	};
};
