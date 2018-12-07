import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';
import { UserErrors } from '../../../user/UserModel';
import ConversationModel from '../../ConversationModel';
import { ForbiddenError } from 'apollo-server-core';
import { fakeCtx, makeUser } from 'Test/utils';
import { markConversationAsRead } from '../markConversationAsRead';

describe('markConversationAsRead', () => {
	let stopMongoose: () => Promise<void>;
	const initDate = new Date().getTime();

	const sessionOwner = makeUser();
	const conv = new ConversationModel({
		users: [sessionOwner],
		seen: [{ user: sessionOwner._id, time: new Date(0) }],
	});
	const conversationId = String(conv._id);

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
		await Promise.all([sessionOwner.save(), conv.save()]);
	});
	afterAll(async () => await stopMongoose());

	test('success', async () => {
		const res = await markConversationAsRead.resolve!(
			{}, { conversationId }, fakeCtx({ sessionOwner }), {} as any
		);
		expect(res).toBe('Success!');

		const convInDB = await ConversationModel.findById(conv._id) as any;
		const seenTime = new Date(convInDB!.seen[0].time).getTime();
		expect(seenTime).toBeLessThanOrEqual(Date.now());
		expect(seenTime).toBeGreaterThan(initDate);
	});

	test('error when unlogged', async () => {
		try {
			await markConversationAsRead.resolve!(
				{}, { conversationId: '123' }, fakeCtx(), {} as any
			);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
		}
	});

	test('error when no rights', async () => {
		try {
			await markConversationAsRead.resolve!(
				{}, { conversationId }, fakeCtx({ sessionOwner: makeUser() }), {} as any
			);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError('Conversation does not exist or access denied'));
		}
	});
});
