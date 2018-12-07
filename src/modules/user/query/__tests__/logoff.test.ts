import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ApolloError } from 'apollo-server-core';
import { UserErrors } from '../../UserModel';
import { fakeCtx, makeUser } from 'Test/utils';
import { logout } from '../logoff';

describe('logoff', () => {
	let stopMongoose: () => Promise<void>;

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	test('successful', async () => {
		const req = {
			logOut: () => { /**/ },
			isUnauthenticated: () => false,
			user: makeUser().toObject()
		};
		const serverRes = {
			cookie: jest.fn((s: string, b: boolean, obj: object) => { /**/ })
		};

		const res = await logout.resolve!({}, {}, fakeCtx({ req, res: serverRes }), {} as any);
		expect(res).toEqual(req.user);
		expect(serverRes.cookie).toHaveBeenCalledWith('logged_in', false, expect.anything());
	});

	test('already logout error', async () => {
		try {
			const req = { isUnauthenticated: () => true };
			await logout.resolve!({}, {}, fakeCtx({ req }), {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ApolloError(UserErrors.AlreadyLoggedOut, 'AlreadyLoggedOut'));
		}
	});
});
