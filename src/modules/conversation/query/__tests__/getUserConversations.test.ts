import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ForbiddenError } from 'apollo-server-core';
import { UserErrors } from '../../../user/UserModel';
import ConversationModel from '../../ConversationModel';
import { fakeCtx, makeUser } from 'Test/utils';
import { getUserConversations } from '../getUserConversations';


describe('getUserConversations', () => {
	let stopMongoose: () => Promise<void>;

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	test('reject when logout', async () => {
		try {
			await getUserConversations.resolve!({}, {}, { sessionOwner: undefined } as any, {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
		}
	});

	test('empty when no user conversations found', async () => {
		const sessionOwner = makeUser();
		const res = await getUserConversations.resolve!({}, {}, fakeCtx({ sessionOwner }), {} as any);
		expect(res).toEqual([]);
	});

	test('correct response', async () => {
		const sessionOwner = makeUser();

		const convObj = { users: [sessionOwner] };
		const conv1 = new ConversationModel(convObj);
		const conv2 = new ConversationModel(convObj);
		const conv3 = new ConversationModel(convObj);

		await ConversationModel.create([conv1, conv2, conv3]);

		const res = await getUserConversations.resolve!({}, {}, fakeCtx({ sessionOwner }), {} as any);
		expect(res).toEqual(expect.arrayContaining([
			expect.objectContaining({ _id: conv1._id }),
			expect.objectContaining({ _id: conv2._id }),
			expect.objectContaining({ _id: conv3._id })
		]));
	});

});
