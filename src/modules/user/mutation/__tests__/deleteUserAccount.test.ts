import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';
import UserModel, { UserErrors } from '../../UserModel';
import { ForbiddenError } from 'apollo-server-core';
import { fakeCtx, makeUser } from 'Test/utils';
import { deleteUserAccount } from '../deleteUserAccount';

describe('deleteUserAccount', () => {
	let mongoose: typeof import('mongoose'); // tslint:disable-line:whitespace
	let stopMongoose: () => Promise<void>;

	beforeAll(async () => {
		({ stopMongoose, mongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	test('success', async () => {
		const sessionOwner = makeUser();
		await sessionOwner.save();

		const res = await deleteUserAccount.resolve!({}, { id: sessionOwner.id }, fakeCtx({ sessionOwner }), {} as any);
		expect(res.toObject()).toEqual(sessionOwner.toObject());

		const userInDB = await UserModel.findById(sessionOwner._id);
		expect(userInDB).toBeNull();
	});

	test('success when admin', async () => {
		const sessionOwner = makeUser(true);
		const userToDelete = makeUser();
		await userToDelete.save();

		const res = await deleteUserAccount.resolve!({}, { id: userToDelete.id }, fakeCtx({ sessionOwner }), {} as any);
		expect(res.toObject()).toEqual(userToDelete.toObject());

		const userInDB = await UserModel.findById(userToDelete._id);
		expect(userInDB).toBeNull();
	});

	test('error when logout', async () => {
		try {
			await deleteUserAccount.resolve!({}, { id: 'sad' }, fakeCtx(), {} as any);

		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
		}
	});

	test('error when have no rights to id', async () => {
		try {
			const sessionOwner = makeUser();
			const id = String(mongoose.Types.ObjectId());

			await deleteUserAccount.resolve!({}, { id }, fakeCtx({ sessionOwner }), {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.RightsForbidden));
		}
	});
});
