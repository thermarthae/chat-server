import 'ts-jest';
import * as faker from 'faker';
import { initTestMongoose } from 'Test/initTestMongoose';
import UserModel, { UserErrors } from '../../../user/UserModel';
import ConversationModel from '../../../conversation/ConversationModel';
import { ForbiddenError, UserInputError } from 'apollo-server-core';
import { fakeCtx, makeUser } from 'Test/utils';
import { sendMessage } from '../sendMessage';

describe('sendMessage', () => {
	let stopMongoose: () => Promise<void>;
	const initDate = new Date().getTime();

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	test('success', async () => {
		const sessionOwner = makeUser();
		const userInConv = makeUser();
		const conversation = new ConversationModel({
			users: [sessionOwner, userInConv],
			draft: [{ user: sessionOwner._id, content: faker.lorem.words(4) }],
			seen: [{ user: sessionOwner._id, time: new Date(0) }],
			significantlyUpdatedAt: new Date(0)
		});
		await Promise.all([UserModel.create([sessionOwner, userInConv]), conversation.save()]);

		const message = faker.lorem.words(4);
		const res = await sendMessage.resolve!(
			{}, { conversationId: 'G' + conversation.id, message }, fakeCtx({ sessionOwner }), {} as any
		);
		expect(res).toMatchObject({
			author: sessionOwner,
			content: message,
			conversation: conversation._id,
			time: expect.any(Date),
			me: true,
		});
		expect(new Date(res.time).getTime()).toBeGreaterThan(initDate);

		const convInDB = await ConversationModel.findById(res.conversation).populate('messages') as any;
		expect(convInDB!.messages[0]).toMatchObject({
			author: sessionOwner._id,
			content: message,
			conversation: conversation._id,
			time: expect.any(Date),
		});
		expect(convInDB!.draft[0]).toMatchObject({ user: sessionOwner._id, content: '' });
		expect(convInDB!.seen[0].user).toEqual(sessionOwner._id);
		expect(new Date(convInDB!.seen[0].time).getTime()).toBeGreaterThan(initDate);
		expect(convInDB!.significantlyUpdatedAt).not.toStrictEqual(new Date(0));
	});

	test('error when unlogged', async () => {
		try {
			const sessionOwner = undefined;
			const conversationId = '123';
			const message = '123';

			await sendMessage.resolve!({}, { conversationId, message }, fakeCtx({ sessionOwner }), {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
		}
	});

	test('error when empty message', async () => {
		try {
			const sessionOwner = makeUser();
			const conversationId = '123';
			const message = '';

			await sendMessage.resolve!({}, { conversationId, message }, fakeCtx({ sessionOwner }), {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new UserInputError('Message could not be empty'));
		}
	});

	test('error when no rights', async () => {
		try {
			const sessionOwner = makeUser();
			const userWithRights = makeUser();
			const conv = new ConversationModel({ users: [userWithRights] });
			await Promise.all([
				UserModel.create([sessionOwner, userWithRights]),
				conv.save()
			]);

			await sendMessage.resolve!(
				{}, { conversationId: 'G' + conv.id, message: '123' }, fakeCtx({ sessionOwner }), {} as any
			);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError('Conversation does not exist or access denied'));
		}
	});
});
