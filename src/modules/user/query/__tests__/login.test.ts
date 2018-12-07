import 'ts-jest';
import * as faker from 'faker';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ApolloError } from 'apollo-server-core';
import UserModel, { UserErrors } from '../../UserModel';
import { fakeCtx, makeUser } from 'Test/utils';
import { login } from '../login';

describe('login', () => {
	let stopMongoose: () => Promise<void>;

	const user = makeUser();
	const password = faker.internet.password();
	const reqSuccess = {
		logIn: (u: any, o: any, d: (e: any) => void) => { /**/ },
		isAuthenticated: () => false,
	};

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
		await UserModel.register(user, password);
	});
	afterAll(async () => await stopMongoose());


	test('successful', async () => {
		const serverRes = {
			cookie: jest.fn((s: string, b: boolean, obj: object) => { /**/ })
		};

		const res = await login.resolve!(
			{}, { username: user.email, password }, fakeCtx({ req: reqSuccess, res: serverRes }), {} as any
		);
		expect(res.toObject()).toEqual(user.toObject());
		expect(serverRes.cookie).toHaveBeenCalledWith('logged_in', true, expect.anything());
	});

	test('already logged error', async () => {
		try {
			const req = { isAuthenticated: () => true };
			await login.resolve!({}, { username: user.email, password }, fakeCtx({ req }), {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ApolloError(UserErrors.AlreadyLoggedIn, 'AlreadyLoggedIn'));
		}
	});

	describe('username', () => {
		test('no username error', async () => {
			try {
				await login.resolve!(
					{}, { username: '', password }, fakeCtx({ req: reqSuccess }), {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.MissingUsernameError, 'MissingUsernameError'));
			}
		});

		test('wrong username error', async () => {
			try {
				await login.resolve!(
					{}, { username: 'blabla', password }, fakeCtx({ req: reqSuccess }), {} as any
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
					{}, { username: user.email, password: '' }, fakeCtx({ req: reqSuccess }), {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.MissingPasswordError, 'MissingPasswordError'));
			}
		});

		test('wrong password error', async () => {
			try {
				await login.resolve!(
					{}, { username: user.email, password: 'blablabla' }, fakeCtx({ req: reqSuccess }), {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.IncorrectPasswordError, 'IncorrectPasswordError'));
			}
		});
	});
});
