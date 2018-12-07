import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ForbiddenError } from 'apollo-server-core';
import { UserErrors } from '../../UserModel';
import { fakeCtx, makeUser } from 'Test/utils';
import { currentUser } from '../currentUser';

describe('currentUser', () => {
	let stopMongoose: () => Promise<void>;

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	test('res when logged in', async () => {
		const sessionOwner = makeUser().toObject();
		const res = await currentUser.resolve!({}, {}, fakeCtx({ sessionOwner }), {} as any);
		expect(res).toEqual(sessionOwner);
	});

	test('error when logout', async () => {
		try {
			await currentUser.resolve!({}, {}, fakeCtx(), {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
		}
	});
});
