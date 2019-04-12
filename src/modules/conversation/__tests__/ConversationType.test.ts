import 'ts-jest';
import { initTestMongoose } from 'Test/initTestMongoose';
import * as faker from 'faker';

import ConversationType from '../ConversationType';
import ConversationModel from '../ConversationModel';
import MessageModel from '../../message/MessageModel';
import { makeUser, parseObj, TFieldMap } from 'Test/utils';
import { UserInputError } from 'apollo-server-core';
import UserModel from '../../user/UserModel';

describe('Conversation Types', () => {
	const types = ConversationType.getFields() as TFieldMap;
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

	describe('messsageFeed', () => {
		test('when not populated', async () => {
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
			await Promise.all([UserModel.create(users), conversation.save(), MessageModel.create(messages)]);

			const cursor = String(messages[3]._id);

			/** [0, (1, 0), 1, 0] */
			const res1 = await types.messageFeed.resolve!(
				conversation.toObject(), { cursor, limit: 2 }, {}, {} as any
			);
			expect(res1.noMore).toEqual(false);
			expect(res1.node).toHaveLength(2);
			expect(res1.node[0]).toEqual(messages[1].toObject());
			expect(res1.node[1]).toEqual(messages[2].toObject());

			/** [(0, 1, 0), 1, 0] */
			const res2 = await types.messageFeed.resolve!(
				conversation.toObject(), { cursor, limit: 3 }, {}, {} as any
			);
			expect(res2.noMore).toEqual(true);
			expect(res2.node).toHaveLength(3);
			expect(res2.node[0]).toEqual(messages[0].toObject());
			expect(res2.node[1]).toEqual(messages[1].toObject());
			expect(res2.node[2]).toEqual(messages[2].toObject());

			/** [0, 1, 0), 1, 0] */
			const res3 = await types.messageFeed.resolve!(
				conversation.toObject(), { cursor, limit: 10 }, {}, {} as any
			);
			expect(res3.noMore).toEqual(true);
			expect(res3.node).toHaveLength(3);
			expect(res3.node[0]).toEqual(messages[0].toObject());
			expect(res3.node[1]).toEqual(messages[1].toObject());
			expect(res3.node[2]).toEqual(messages[2].toObject());
		});

		test('when populated', async () => {
			const users = [1, 2].map(() => makeUser());

			const messages = [0, 1, 0, 1, 0].map((i, index) => new MessageModel({
				author: users[i],
				content: index + ': ' + faker.lorem.words(3)
			}));
			const conversation = new ConversationModel({
				users,
				messages
			});

			/** [0, 1, 0, >(1), 0] */
			const cursor = String(messages[3]._id);

			/** [0, (1, 0), 1, 0] */
			const res1 = await types.messageFeed.resolve!(conversation.toObject(), { cursor, limit: 2 }, {}, {} as any);
			expect(res1.noMore).toEqual(false);
			expect(res1.node).toHaveLength(2);
			expect(res1.node[0]).toEqual(messages[1].toObject());
			expect(res1.node[1]).toEqual(messages[2].toObject());

			/** [(0, 1, 0), 1, 0] */
			const res2 = await types.messageFeed.resolve!(
				conversation.toObject(), { cursor, limit: 3 }, {}, {} as any
			);
			expect(res2.node).toHaveLength(3);
			expect(res2.noMore).toEqual(true);
			expect(res2.node[0]).toEqual(messages[0].toObject());
			expect(res2.node[1]).toEqual(messages[1].toObject());
			expect(res2.node[2]).toEqual(messages[2].toObject());

			/** [0, 1, 0), 1, 0] */
			const res3 = await types.messageFeed.resolve!(
				conversation.toObject(), { cursor, limit: 10 }, {}, {} as any
			);
			expect(res3.node).toHaveLength(3);
			expect(res3.noMore).toEqual(true);
			expect(res3.node[0]).toEqual(messages[0].toObject());
			expect(res3.node[1]).toEqual(messages[1].toObject());
			expect(res3.node[2]).toEqual(messages[2].toObject());
		});

		test('when conversation is cached', async () => {
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
			await Promise.all([UserModel.create(users), conversation.save(), MessageModel.create(messages)]);

			const cachedConv = parseObj(conversation.toObject());
			const cursor = String(messages[3]._id);

			/** [0, (1, 0), 1, 0] */
			const res1 = await types.messageFeed.resolve!(cachedConv, { cursor, limit: 2 }, {}, {} as any);
			expect(res1.noMore).toEqual(false);
			expect(res1.node).toHaveLength(2);
			expect(parseObj(res1.node[0])).toEqual(parseObj(messages[1]));
			expect(parseObj(res1.node[1])).toEqual(parseObj(messages[2]));

			/** [(0, 1, 0), 1, 0] */
			const res2 = await types.messageFeed.resolve!(cachedConv, { cursor, limit: 3 }, {}, {} as any);
			expect(res2.noMore).toEqual(true);
			expect(res2.node).toHaveLength(3);
			expect(parseObj(res2.node[0])).toEqual(parseObj(messages[0]));
			expect(parseObj(res2.node[1])).toEqual(parseObj(messages[1]));
			expect(parseObj(res2.node[2])).toEqual(parseObj(messages[2]));

			/** [0, 1, 0), 1, 0] */
			const res3 = await types.messageFeed.resolve!(cachedConv, { cursor, limit: 3 }, {}, {} as any);
			expect(res3.noMore).toEqual(true);
			expect(res3.node).toHaveLength(3);
			expect(parseObj(res3.node[0])).toEqual(parseObj(messages[0]));
			expect(parseObj(res3.node[1])).toEqual(parseObj(messages[1]));
			expect(parseObj(res3.node[2])).toEqual(parseObj(messages[2]));
		});

		describe('cursor', () => {
			describe('when messgage id equal to cursor not found', () => {
				test('in not populated', async () => {
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
					await Promise.all([UserModel.create(users), conversation.save(), MessageModel.create(messages)]);

					const cursor = String(mongoose.Types.ObjectId());

					await types.messageFeed.resolve!(conversation.toObject(), { cursor, limit: 2 }, {}, {} as any)
						.then((x: any) => expect(x).toBeUndefined())
						.catch((e: any) => {
							expect(e).toStrictEqual(new UserInputError('Message with id equal to cursor does not exist'));
						});
				});

				test('in populated', async () => {
					const users = [1, 2].map(() => makeUser());

					const messages = [0, 1, 0, 1, 0].map(i => new MessageModel({
						author: users[i],
						content: faker.lorem.words(3),
					}));
					const conversation = new ConversationModel({
						users,
						messages
					});

					const cursor = String(mongoose.Types.ObjectId());

					await types.messageFeed.resolve!(conversation.toObject(), { cursor, limit: 2 }, {}, {} as any)
						.then((x: any) => expect(x).toBeUndefined())
						.catch((e: any) => {
							expect(e).toStrictEqual(new UserInputError('Message with id equal to cursor does not exist'));
						});
				});

			});

			describe('when no cursor', () => {
				test('when not populated', async () => {
					const users = [1, 2].map(() => makeUser());

					const convID = mongoose.Types.ObjectId();
					const messages = [0, 1, 0, 1, 0].map((i, ind) => new MessageModel({
						author: users[i],
						content: ind + faker.lorem.words(3),
						conversation: convID,
					}));
					const conversation = new ConversationModel({
						_id: convID,
						users,
						messages: messages.map(msg => msg.id)
					});
					await Promise.all([UserModel.create(users), conversation.save(), MessageModel.create(messages)]);

					/** [0, 1, 0, (1, 0)] */
					const res1 = await types.messageFeed.resolve!(conversation.toObject(), { limit: 2 }, {}, {} as any);
					expect(res1.noMore).toEqual(false);
					expect(res1.node).toHaveLength(2);
					(res1.node as any[]).forEach((msg, index) => expect(msg).toEqual(messages[3 + index].toObject()));

					/** [0, 1, 0, 1, 0)] */
					const res2 = await types.messageFeed.resolve!(conversation.toObject(), { limit: 6 }, {}, {} as any);
					expect(res2.noMore).toEqual(true);
					expect(res2.node).toHaveLength(5);
					(res2.node as any[]).forEach((msg, index) => expect(msg).toEqual(messages[index].toObject()));
				});

				test('when populated', async () => {
					const users = [1, 2].map(() => makeUser());

					const messages = [0, 1, 0, 1, 0].map((i, index) => new MessageModel({
						author: users[i],
						content: index + ': ' + faker.lorem.words(3)
					}));
					const conversation = new ConversationModel({
						users,
						messages
					});

					/** [0, 1, 0, (1, 0)] */
					const res1 = await types.messageFeed.resolve!(conversation.toObject(), { limit: 2 }, {}, {} as any);
					expect(res1.noMore).toEqual(false);
					expect(res1.node).toHaveLength(2);
					(res1.node as any[]).forEach((msg, index) => expect(msg).toEqual(messages[3 + index].toObject()));

					/** [0, 1, 0, 1, 0)] */
					const res2 = await types.messageFeed.resolve!(conversation.toObject(), { limit: 6 }, {}, {} as any);
					expect(res2.noMore).toEqual(true);
					expect(res2.node).toHaveLength(5);
					(res2.node as any[]).forEach((msg, index) => expect(msg).toEqual(messages[index].toObject()));
				});
			});
		});

		test('when limit is < 1', async () => {
			await types.messageFeed.resolve!({}, { limit: 0 }, {}, {} as any)
				.then((x: any) => expect(x).toBeUndefined())
				.catch((e: any) => {
					expect(e).toStrictEqual(new UserInputError('Limit must be greater than 0'));
				});

			await types.messageFeed.resolve!({}, { limit: -2 }, {}, {} as any)
				.then((x: any) => expect(x).toBeUndefined())
				.catch((e: any) => {
					expect(e).toStrictEqual(new UserInputError('Limit must be greater than 0'));
				});
		});
	});
});
