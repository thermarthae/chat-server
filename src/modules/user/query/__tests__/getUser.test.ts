import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ForbiddenError, ApolloError } from 'apollo-server-core';
import { UserErrors, IUser } from '../../UserModel';
import { fakeCtx, makeUser } from 'Test/utils';
import { getUser } from '../getUser';

describe('getUser', () => {
	let mongoose: typeof import('mongoose'); // tslint:disable-line:whitespace
	let stopMongoose: () => Promise<void>;
	let userToFind: IUser;

	beforeAll(async () => {
		({ mongoose, stopMongoose } = await initTestMongoose());
		userToFind = await makeUser().save().then(res => res.toObject());
	});
	afterAll(async () => await stopMongoose());

	test('res when logged in', async () => {
		const res = await getUser.resolve!(
			{}, { id: userToFind._id }, fakeCtx({ sessionOwner: userToFind }), {} as any
		);

		expect(res.toObject()).toEqual(userToFind);
	});

	test('error when logout', async () => {
		try {
			await getUser.resolve!(
				{}, { id: userToFind._id }, fakeCtx(), {} as any
			);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
		}
	});

	test('error when no rights to id', async () => {
		try {
			const sessionOwner = makeUser();
			await getUser.resolve!(
				{}, { id: userToFind._id }, fakeCtx({ sessionOwner }), {} as any
			);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.RightsForbidden));

		}
	});

	test('when admin rights', async () => {
		const sessionOwner = makeUser(true);
		const res = await getUser.resolve!(
			{}, { id: userToFind._id }, fakeCtx({ sessionOwner }), {} as any
		);

		expect(res.toObject()).toEqual(userToFind);
	});

	test('error when user not exist', async () => {
		try {
			const sessionOwner = makeUser(true);
			await getUser.resolve!(
				{}, { id: String(mongoose.Types.ObjectId()) }, fakeCtx({ sessionOwner }), {} as any
			);
		} catch (e) {
			expect(e).toStrictEqual(new ApolloError(UserErrors.UserNotExistsError, 'UserNotExistsError'));
		}
	});
});
