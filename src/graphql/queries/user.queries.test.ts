import 'ts-jest';
import * as faker from 'faker';
import MongoMemoryServer from 'mongodb-memory-server';
import initMongoose from '../../initMongoose';

import { ForbiddenError, ApolloError, UserInputError } from 'apollo-server-core';
import UserModel, { UserErrors, IUser } from '../../models/user';
import { getUser, findUser, currentUser, login, logout } from './user.queries';
import dataloaders from '../../dataloaders';

const makeUser = (admin = false) => {
	return new UserModel({
		name: faker.internet.userName(),
		email: faker.internet.email(),
		role: admin ? 'ADMIN' : 'USER',
	});
};

describe('User queries', () => {
	let mongoServer: MongoMemoryServer;
	let mongoose: typeof import('mongoose'); // tslint:disable-line:whitespace
	let userToFind: IUser;

	beforeAll(async () => {
		mongoServer = new MongoMemoryServer();
		const mongoUri = await mongoServer.getConnectionString();
		mongoose = await initMongoose(mongoUri);
		userToFind = await makeUser().save().then(res => res.toObject());
	});
	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	describe('getUser', () => {
		test('res when logged in', async () => {
			const res = await getUser.resolve!(
				{}, { id: userToFind._id }, { sessionOwner: userToFind, ...dataloaders() }, {} as any
			);

			expect(res.toObject()).toEqual(userToFind);
		});

		test('error when logout', async () => {
			try {
				await getUser.resolve!(
					{}, { id: userToFind._id }, { sessionOwner: undefined, ...dataloaders() }, {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
			}
		});

		test('error when no rights to id', async () => {
			try {
				const sessionOwner = makeUser();
				await getUser.resolve!(
					{}, { id: userToFind._id }, { sessionOwner, ...dataloaders() }, {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.RightsForbidden));

			}
		});

		test('when admin rights', async () => {
			const sessionOwner = makeUser(true);
			const res = await getUser.resolve!(
				{}, { id: userToFind._id }, { sessionOwner, ...dataloaders() }, {} as any
			);

			expect(res.toObject()).toEqual(userToFind);
		});

		test('error when user not exist', async () => {
			try {
				const sessionOwner = makeUser(true);
				await getUser.resolve!(
					{}, { id: String(mongoose.Types.ObjectId()) }, { sessionOwner, ...dataloaders() }, {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.UserNotExistsError, 'UserNotExistsError'));
			}
		});
	});

	describe('findUser', () => {
		test('error when logout', async () => {
			try {
				await findUser.resolve!(
					{}, { query: userToFind.name }, { sessionOwner: undefined } as any, {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
			}
		});

		describe('when logged in', () => {
			test('error when query too short', async () => {
				try {
					const sessionOwner = makeUser();
					await findUser.resolve!(
						{}, { query: userToFind.name.slice(0, 2) }, { sessionOwner } as any, {} as any
					);
				} catch (e) {
					expect(e).toStrictEqual(new UserInputError('Query must be at least 3 characters long'));
				}
			});

			test('successful', async () => {
				const sessionOwner = makeUser();
				const res = await findUser.resolve!(
					{}, { query: userToFind.name }, { sessionOwner } as any, {} as any
				);
				expect(res[0].toObject()).toEqual(userToFind);
			});
		});
	});

	describe('currentUser', () => {
		test('res when logged in', async () => {
			const sessionOwner = makeUser().toObject();
			const res = await currentUser.resolve!({}, {}, { sessionOwner } as any, {} as any);
			expect(res).toEqual(sessionOwner);
		});

		test('error when logout', async () => {
			try {
				await currentUser.resolve!({}, {}, { sessionOwner: undefined } as any, {} as any);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
			}
		});
	});

	describe('login', () => {
		const user = makeUser();
		const password = faker.internet.password();
		const reqSuccess = {
			logIn: (u: any, o: any, d: (e: any) => void) => { /**/ },
			isAuthenticated: () => false,
		};

		beforeAll(async () => {
			await UserModel.register(user, password);
		});

		test('successful', async () => {
			const res = await login.resolve!({}, { username: user.email, password }, { req: reqSuccess } as any, {} as any);
			expect(res.toObject()).toEqual(user.toObject());
		});

		test('already logged error', async () => {
			try {
				const req = { isAuthenticated: () => true };
				await login.resolve!({}, { username: user.email, password }, { req } as any, {} as any);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.AlreadyLoggedIn, 'AlreadyLoggedIn'));
			}
		});

		describe('username', () => {
			test('no username error', async () => {
				try {
					await login.resolve!(
						{}, { username: '', password }, { req: reqSuccess } as any, {} as any
					);
				} catch (e) {
					expect(e).toStrictEqual(new ApolloError(UserErrors.MissingUsernameError, 'MissingUsernameError'));
				}
			});

			test('wrong username error', async () => {
				try {
					await login.resolve!(
						{}, { username: 'blabla', password }, { req: reqSuccess } as any, {} as any
					);
				} catch (e) {
					expect(e).toStrictEqual(new ApolloError(UserErrors.IncorrectUsernameError, 'IncorrectUsernameError'));
				}
			});
		});

		describe('password', () => {
			test('no password error', async () => {
				try {
					await login.resolve!(
						{}, { username: user.email, password: '' }, { req: reqSuccess } as any, {} as any
					);
				} catch (e) {
					expect(e).toStrictEqual(new ApolloError(UserErrors.MissingPasswordError, 'MissingPasswordError'));
				}
			});

			test('wrong password error', async () => {
				try {
					await login.resolve!(
						{}, { username: user.email, password: 'blablabla' }, { req: reqSuccess } as any, {} as any
					);
				} catch (e) {
					expect(e).toStrictEqual(new ApolloError(UserErrors.IncorrectPasswordError, 'IncorrectPasswordError'));
				}
			});
		});
	});

	describe('logoff', () => {
		test('successful', async () => {
			const req = {
				logOut: () => { /**/ },
				isUnauthenticated: () => false,
				user: makeUser().toObject()
			};

			const res = await logout.resolve!({}, {}, { req } as any, {} as any);
			expect(res).toEqual(req.user);
		});

		test('already logout error', async () => {
			try {
				const req = { isUnauthenticated: () => true };
				await logout.resolve!({}, {}, { req } as any, {} as any);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.AlreadyLoggedOut, 'AlreadyLoggedOut'));
			}
		});
	});
});
