import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ForbiddenError } from 'apollo-server-core';
import UserModel, { UserErrors } from '../../../user/UserModel';
import ConversationModel from '../../ConversationModel';
import { fakeCtx, makeUser } from 'Test/utils';
import { getConversation } from '../getConversation';

describe('getConversation', () => {
	let mongoose: typeof import('mongoose');
	let stopMongoose: () => Promise<void>;
	const convError = new ForbiddenError('Conversation does not exist or access denied');

	beforeAll(async () => {
		({ stopMongoose, mongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	test('response when normal rights', async () => {
		const sessionOwner = makeUser();
		const conv = new ConversationModel({ users: [sessionOwner] });
		await Promise.all([sessionOwner.save(), conv.save()]);

		const res = await getConversation.resolve!(
			{}, { id: 'G' + conv.id }, fakeCtx({ sessionOwner }), {} as any
		);
		expect(res).toEqual(conv.toObject());
	});

	test('response when admin rights', async () => {
		const sessionOwner = makeUser(true);
		const conv = new ConversationModel();
		await conv.save();

		const res = await getConversation.resolve!(
			{}, { id: 'G' + conv.id }, fakeCtx({ sessionOwner }), {} as any
		);
		expect(res).toEqual(conv.toObject());
	});

	test('reject when no rights', async () => {
		try {
			const userWithRights = makeUser();
			const userWithoutRights = makeUser();
			const conv = new ConversationModel({ users: [userWithRights] });
			await Promise.all([
				UserModel.create([userWithRights, userWithoutRights]),
				conv.save()
			]);

			await getConversation.resolve!(
				{}, { id: 'G' + conv.id }, fakeCtx({ sessionOwner: userWithoutRights }), {} as any
			);
		} catch (e) {
			expect(e).toStrictEqual(convError);
		}
	});

	test('reject when conversation not exist', async () => {
		try {
			const sessionOwner = makeUser();
			const id = 'G' + mongoose.Types.ObjectId().toHexString();

			await getConversation.resolve!(
				{}, { id }, fakeCtx({ sessionOwner }), {} as any
			);
		} catch (e) {
			expect(e).toStrictEqual(convError);
		}
	});

	test('reject when logout', async () => {
		try {
			const id = 'G' + mongoose.Types.ObjectId().toHexString();
			await getConversation.resolve!(
				{}, { id }, fakeCtx(), {} as any
			);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
		}
	});
});
