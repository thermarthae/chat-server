import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ForbiddenError, UserInputError } from 'apollo-server-core';
import { UserErrors, IUser } from '../../UserModel';
import { fakeCtx, makeUser } from 'Test/utils';
import { findUser } from '../findUser';

describe('findUser', () => {
	let stopMongoose: () => Promise<void>;
	let userToFind: IUser;

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
		userToFind = await makeUser().save().then(res => res.toObject());
	});
	afterAll(async () => await stopMongoose());

	test('error when logout', async () => {
		try {
			await findUser.resolve!(
				{}, { query: userToFind.name }, fakeCtx(), {} as any
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
					{}, { query: userToFind.name.slice(0, 2) }, fakeCtx({ sessionOwner }), {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new UserInputError('Query must be at least 3 characters long'));
			}
		});

		test('successful', async () => {
			const sessionOwner = makeUser();
			const res = await findUser.resolve!(
				{}, { query: userToFind.name }, fakeCtx({ sessionOwner }), {} as any
			);
			expect(res[0].toObject()).toEqual(userToFind);
		});
	});
});
