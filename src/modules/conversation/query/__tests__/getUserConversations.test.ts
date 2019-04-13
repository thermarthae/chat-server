import 'ts-jest';
import * as mongoose from 'mongoose';
import * as faker from 'faker';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ForbiddenError } from 'apollo-server-core';
import UserModel, { UserErrors } from '../../../user/UserModel';
import ConversationModel from '../../ConversationModel';
import MessageModel from '../../../message/MessageModel';
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
		const users = [1, 2].map(() => makeUser());
		const sessionOwner = users[0];
		const lastMsgIndex = 4; // messages1.length - 1, ...

		const convID1 = mongoose.Types.ObjectId();
		const messages1 = [0, 1, 0, 1, 0].map(i => new MessageModel({
			author: users[i],
			content: faker.lorem.words(3),
			conversation: convID1,
		}));
		const conv1 = new ConversationModel({
			_id: convID1,
			users,
			messages: messages1
		});

		const convID2 = mongoose.Types.ObjectId();
		const messages2 = [0, 1, 0, 1, 0].map(i => new MessageModel({
			author: users[i],
			content: faker.lorem.words(3),
			conversation: convID2,
		}));
		const conv2 = new ConversationModel({
			_id: convID2,
			users,
			messages: messages2
		});

		const convID3 = mongoose.Types.ObjectId();
		const messages3 = [0].map(i => new MessageModel({
			author: users[i],
			content: faker.lorem.words(3),
			conversation: convID3,
		}));
		const conv3 = new ConversationModel({
			_id: convID3,
			users,
			messages: messages3
		});

		await Promise.all([
			UserModel.create(users),
			ConversationModel.create([conv1, conv2, conv3]),
			MessageModel.create([messages1, messages2, messages3].flat())
		]);

		const res = await getUserConversations.resolve!({}, {}, fakeCtx({ sessionOwner }), {} as any);

		//check if has all conversations
		expect(res).toHaveLength(3);
		expect(res[0]._id).toEqual(conv1._id);
		expect(res[1]._id).toEqual(conv2._id);
		expect(res[2]._id).toEqual(conv3._id);

		//check population
		expect(res[0].users[0]).toHaveProperty('name');
		expect(res[0].messages[0]).toHaveProperty('_id', messages1[lastMsgIndex]._id);
		expect(res[0].messages[0].author).toHaveProperty('_id', messages1[lastMsgIndex].author._id);

		//check noMoreMessages
		expect(res[0].noMoreMessages).toEqual(false);
		expect(res[1].noMoreMessages).toEqual(false);
		expect(res[2].noMoreMessages).toEqual(true);
	});
});
