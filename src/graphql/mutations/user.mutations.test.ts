import 'ts-jest';
import * as faker from 'faker';
import MongoMemoryServer from 'mongodb-memory-server';
import initMongoose from '../../initMongoose';
import UserModel, { UserErrors } from '../../models/user';
import { ApolloError, ForbiddenError } from 'apollo-server-core';
import { register, deleteUserAccount } from './user.mutations';

const makeUser = (admin = false) => {
	return new UserModel({
		name: faker.internet.userName(),
		email: faker.internet.email(),
		role: admin ? 'ADMIN' : 'USER',
	});
};

describe('User mutations', () => {
	let mongoServer: MongoMemoryServer;
	let mongoose: typeof import('mongoose'); // tslint:disable-line:whitespace

	beforeAll(async () => {
		mongoServer = new MongoMemoryServer();
		const mongoUri = await mongoServer.getConnectionString();
		mongoose = await initMongoose(mongoUri);
	});
	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	describe('register', () => {
		test('success', async () => {
			const payload = {
				name: faker.internet.userName(),
				email: faker.internet.email(),
				password: 'password',
			};

			const res = await register.resolve!({}, payload, {} as any, {} as any);
			const userInDB = await UserModel.findById(res._id);
			expect(res.toObject()).toEqual(userInDB!.toObject());
		});

		test('error when password is too short', async () => {
			try {
				const payload = {
					name: faker.internet.userName(),
					email: faker.internet.email(),
					password: '1234567',
				};
				await register.resolve!({}, payload, {} as any, {} as any);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.PasswordIsTooShort, 'PasswordIsTooShort'));
			}
		});

		test('error when username is too short', async () => {
			try {
				const payload = {
					name: faker.internet.userName(),
					email: '12',
					password: 'password',
				};
				await register.resolve!({}, payload, {} as any, {} as any);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.UsernameIsTooShort, 'UsernameIsTooShort'));
			}
		});

		test('error when username is already registered', async () => {
			try {
				const payload = {
					name: faker.internet.userName(),
					email: faker.internet.email(),
					password: 'password',
				};
				await register.resolve!({}, payload, {} as any, {} as any);

				const newPayload = Object.assign({}, payload, { name: faker.internet.userName() });
				await register.resolve!({}, newPayload, {} as any, {} as any);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.UserExistsError, 'UserExistsError'));
			}
		});
	});

	describe('deleteUserAccount', () => {
		test('success', async () => {
			const sessionOwner = makeUser();
			await sessionOwner.save();

			const res = await deleteUserAccount.resolve!({}, { id: sessionOwner.id }, { sessionOwner } as any, {} as any);
			expect(res.toObject()).toEqual(sessionOwner.toObject());

			const userInDB = await UserModel.findById(sessionOwner._id);
			expect(userInDB).toBeNull();
		});

		test('success when admin', async () => {
			const sessionOwner = makeUser(true);
			const userToDelete = makeUser();
			await userToDelete.save();

			const res = await deleteUserAccount.resolve!({}, { id: userToDelete.id }, { sessionOwner } as any, {} as any);
			expect(res.toObject()).toEqual(userToDelete.toObject());

			const userInDB = await UserModel.findById(userToDelete._id);
			expect(userInDB).toBeNull();
		});

		test('error when logout', async () => {
			try {
				await deleteUserAccount.resolve!({}, { id: 'sad' }, { sessionOwner: undefined } as any, {} as any);

			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
			}
		});

		test('error when have no rights to id', async () => {
			try {
				const sessionOwner = makeUser();
				const id = String(mongoose.Types.ObjectId());

				await deleteUserAccount.resolve!({}, { id }, { sessionOwner } as any, {} as any);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.RightsForbidden));
			}
		});
	});
});