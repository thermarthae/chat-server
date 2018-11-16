import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';
import * as faker from 'faker';

import { conversationType, userConversationsType } from './conversation.types';
import ConversationModel from '../../models/conversation';
import MessageModel from '../../models/message';
import { makeUser, parseObj } from 'Test/utils';

describe('Conversation Types', () => {
	const types = conversationType.getFields();
	let mongoose: typeof import('mongoose'); // tslint:disable-line:whitespace
	let stopMongoose: () => Promise<void>;

	beforeAll(async () => {
		({ mongoose, stopMongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	test('_id', () => {
		const id = 'asdasdasd';
		const res = types._id.resolve!({ _id: id }, {}, {}, {} as any);
		expect(res).toEqual(id);
	});

	describe('name', () => {
		test('made from user names', () => {
			const user1 = makeUser();
			const user2 = makeUser();
			const user3 = makeUser();

			const conversation = new ConversationModel({
				name: null,
				users: [user1, user2, user3],
			});

			const res = types.name.resolve!(conversation, {}, { sessionOwner: user1 }, {} as any);
			expect(res).toEqual(`${user2.name}, ${user3.name}`);
		});
		test('custom name', () => {
			const name = faker.lorem.words(2);
			const conversation = new ConversationModel({ name });

			const res = types.name.resolve!(conversation, {}, {}, {} as any);
			expect(res).toEqual(name);
		});
	});

	describe('users', () => {
		test('res without logged user', () => {
			const users = [makeUser(), makeUser(), makeUser()];

			const res = types.users.resolve!({ users }, {}, { sessionOwner: users[0] }, {} as any);
			expect(res).toEqual([users[1], users[2]]);
		});
	});

	describe('seen', () => {
		const sessionOwner = makeUser();

		test('true when array', () => {
			const conversation = {
				seen: [{
					user: sessionOwner._id,
					time: new Date() // now
				}],
				significantlyUpdatedAt: new Date(0), // 1970
			};

			const res = types.seen.resolve!(conversation, {}, { sessionOwner }, {} as any);
			expect(res).toEqual(true);
		});

		test('true when object', () => {
			const conversation = {
				seen: {
					user: sessionOwner._id,
					time: new Date() // now
				},
				significantlyUpdatedAt: new Date(0), // 1970
			};

			const res = types.seen.resolve!(conversation, {}, { sessionOwner }, {} as any);
			expect(res).toEqual(true);
		});

		test('false', () => {
			const conversation = {
				seen: [{
					user: sessionOwner._id,
					time: new Date(0), // 1970
				}],
				significantlyUpdatedAt: new Date(), // now
			};

			const res = types.seen.resolve!(conversation, {}, { sessionOwner }, {} as any);
			expect(res).toEqual(false);
		});

		test('false when not exist', () => {
			const conversation = {
				seen: [],
				significantlyUpdatedAt: new Date()
			};

			const res = types.seen.resolve!(conversation, {}, { sessionOwner }, {} as any);
			expect(res).toEqual(false);
		});
	});

	describe('draft', () => {
		const sessionOwner = makeUser();

		test('when exist as array', () => {
			const draftContent = faker.lorem.words(3);
			const draft = [{
				user: sessionOwner._id,
				content: draftContent
			}];

			const res = types.draft.resolve!({ draft }, {}, { sessionOwner }, {} as any);
			expect(res).toEqual(draftContent);
		});

		test('when exist as object', () => {
			const draftContent = faker.lorem.words(3);
			const draft = {
				user: sessionOwner._id,
				content: draftContent
			};

			const res = types.draft.resolve!({ draft }, {}, { sessionOwner }, {} as any);
			expect(res).toEqual(draftContent);
		});

		test('when not exist', () => {
			const draft = Array();

			const res = types.draft.resolve!({ draft }, {}, { sessionOwner }, {} as any);
			expect(res).toEqual('');
		});
	});

	describe('messsages', () => {
		test('when depopulated', async () => {
			const limit = 2;
			const skip = 2;
			const users = [1, 2].map(() => makeUser());

			const convID = mongoose.Types.ObjectId();
			const messages = [0, 1, 0, 1, 0].map(i => new MessageModel({
				author: users[i],
				content: faker.lorem.words(3),
				conversation: convID,
			}));
			const conversation = new ConversationModel({
				_id: convID,
				users,
				messages: messages.map(msg => msg.id)
			});
			await Promise.all([conversation.save(), MessageModel.create(messages)]);

			const res = await types.messages.resolve!(conversation.toObject(), { skip, limit }, {}, {} as any);
			expect(res).toHaveLength(limit);
			expect(res[0]).toEqual(messages[1].toObject());
			expect(res[1]).toEqual(messages[2].toObject());
		});

		test('when populated', async () => {
			const limit = 2;
			const skip = 2;
			const users = [1, 2].map(() => makeUser());

			const messages = [0, 1, 0, 1, 0].map(i => new MessageModel({
				author: users[i],
				content: faker.lorem.words(3)
			}));
			const conversation = new ConversationModel({
				users,
				messages
			});

			const res = await types.messages.resolve!(conversation.toObject(), { skip, limit }, {}, {} as any);
			expect(res).toHaveLength(limit);
			expect(res[0]).toEqual(messages[1].toObject());
			expect(res[1]).toEqual(messages[2].toObject());
		});

		test('when conversation is cached', async () => {
			const limit = 2;
			const skip = 2;
			const users = [1, 2].map(() => makeUser());

			const convID = mongoose.Types.ObjectId();
			const messages = [0, 1, 0, 1, 0].map(i => new MessageModel({
				author: users[i],
				content: faker.lorem.words(3),
				conversation: convID,
			}));
			const conversation = new ConversationModel({
				_id: convID,
				users,
				messages: messages.map(msg => msg.id)
			});
			await Promise.all([conversation.save(), MessageModel.create(messages)]);

			const cachedConv = parseObj(conversation.toObject());
			const res = await types.messages.resolve!(cachedConv, { skip, limit }, {}, {} as any);
			expect(res).toHaveLength(limit);
			expect(parseObj(messages[1])).toEqual(parseObj(res[0]));
			expect(parseObj(messages[2])).toEqual(parseObj(res[1]));
		});

		test('when not found', async () => {
			const messages = [mongoose.Types.ObjectId()];
			const conversation = new ConversationModel({ messages });

			const res = await types.messages.resolve!(conversation, { skip: 2, limit: 2 }, {}, {} as any);
			expect(res).toHaveLength(0);
		});
	});
});

test('userConversations Types exist', () => {
	const types = userConversationsType.getFields();
	expect(types).toBeDefined();
});
