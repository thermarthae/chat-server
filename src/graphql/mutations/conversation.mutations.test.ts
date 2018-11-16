import 'ts-jest';
import * as faker from 'faker';
import { initTestMongoose } from 'Test/initTestMongoose';
import UserModel, { UserErrors } from '../../models/user';
import { initConversation, sendMessage, markConversationAsRead } from './conversation.mutations';
import ConversationModel from '../../models/conversation';
import { ForbiddenError, UserInputError, ApolloError } from 'apollo-server-core';
import { fakeCtx, makeUser } from 'Test/utils';

describe('Conversation mutations', () => {
	let stopMongoose: () => Promise<void>;
	const initDate = new Date().getTime();

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	describe('initConversation', () => {
		test('conversation in database', async () => {
			const sessionOwner = makeUser();
			const userInConv = makeUser();
			await UserModel.create([sessionOwner, userInConv]);

			const userIdArr = [userInConv.id];
			const message = faker.lorem.words(3);
			const name = faker.lorem.words(3);

			const res = await initConversation.resolve!(
				{}, { userIdArr, message, name }, fakeCtx({ sessionOwner }), {} as any
			);
			const convInDB = await ConversationModel.findById(res._id).populate(['users', 'messages']);
			const any = expect.anything(); // tslint:disable-line:variable-name
			expect(convInDB!.name).toEqual(res!.name);
			expect(convInDB!.toObject()).toMatchObject({
				_id: res._id,
				name,
				users: expect.arrayContaining([sessionOwner.toObject(), userInConv.toObject()]),
				messages: expect.arrayContaining([expect.objectContaining({ content: message })]),
				seen: expect.arrayContaining([
					{ _id: any, user: sessionOwner._id, time: expect.any(Date) },
					{ _id: any, user: userInConv._id, time: new Date(0) }
				]),
				draft: expect.arrayContaining([
					{ _id: any, user: sessionOwner._id, content: '' },
					{ _id: any, user: userInConv._id, content: '' },
				])
			});
		});

		test('should remove duplicates from userIdArr', async () => {
			const sessionOwner = makeUser();
			const userInConv = makeUser();
			await UserModel.create([sessionOwner, userInConv]);

			const userIdArr = [sessionOwner.id, sessionOwner.id, userInConv.id, userInConv.id];
			const message = faker.lorem.words(3);
			const name = null;

			const res = await initConversation.resolve!(
				{}, { userIdArr, message, name }, fakeCtx({ sessionOwner }), {} as any
			);
			const convInDB = await ConversationModel.findById(res._id).populate(['users', 'messages']);
			expect(convInDB!.users).toHaveLength(2);
			expect(convInDB!.toObject()).toMatchObject({
				_id: res._id,
				users: expect.arrayContaining([sessionOwner.toObject(), userInConv.toObject()]),
			});
		});

		test('error when unlogged', async () => {
			try {
				const sessionOwner = undefined;
				const userIdArr = ['123'];
				const message = '123';
				const name = null;

				await initConversation.resolve!(
					{}, { userIdArr, message, name }, fakeCtx({ sessionOwner }), {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
			}
		});

		test('error when empty message', async () => {
			try {
				const sessionOwner = makeUser();
				const userIdArr = ['123'];
				const message = '';
				const name = null;

				await initConversation.resolve!(
					{}, { userIdArr, message, name }, fakeCtx({ sessionOwner }), {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new UserInputError('Message could not be empty'));
			}
		});

		test('error when empty userIdArr', async () => {
			try {
				const sessionOwner = makeUser();
				const userIdArr = Array();
				const message = '123';
				const name = null;

				await initConversation.resolve!(
					{}, { userIdArr, message, name }, fakeCtx({ sessionOwner }), {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new UserInputError('userIdArr must contain at least 1 user id'));
			}
		});

		test('error when user in userIdArr not exist', async () => {
			try {
				const sessionOwner = await makeUser().save();
				const userThatNotExist = makeUser();
				const userIdArr = [userThatNotExist.id];
				const message = '123';
				const name = null;

				await initConversation.resolve!(
					{}, { userIdArr, message, name }, fakeCtx({ sessionOwner }), {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ApolloError(UserErrors.UserNotExistsError, 'UserNotExistsError'));
			}
		});
	});

	describe('sendMessage', () => {
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
				{}, { conversationId: conversation.id, message }, fakeCtx({ sessionOwner }), {} as any
			);
			expect(res).toMatchObject({
				author: {
					_id: sessionOwner._id,
					name: sessionOwner.name,
					email: sessionOwner.email,
				},
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
					{}, { conversationId: conv.id, message: '123' }, fakeCtx({ sessionOwner }), {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError('Conversation does not exist or access denied'));
			}
		});
	});

	describe('markConversationAsRead', () => {
		const sessionOwner = makeUser();
		const conv = new ConversationModel({
			users: [sessionOwner],
			seen: [{ user: sessionOwner._id, time: new Date(0) }],
		});
		const conversationId = String(conv._id);

		beforeAll(async () => {
			await Promise.all([sessionOwner.save(), conv.save()]);
		});

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

});
