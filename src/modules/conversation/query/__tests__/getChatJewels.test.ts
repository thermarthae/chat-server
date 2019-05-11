import 'ts-jest';
import * as faker from 'faker';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ForbiddenError } from 'apollo-server-core';
import { UserErrors } from '../../../user/UserModel';
import ConversationModel from '../../ConversationModel';
import MessageModel from '../../../message/MessageModel';
import { fakeCtx, makeUser } from 'Test/utils';
import { getChatJewels } from '../getChatJewels';


describe('getChatJewels', () => {
	let mongoose: typeof import('mongoose');
	let stopMongoose: () => Promise<void>;

	beforeAll(async () => {
		({ stopMongoose, mongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	test('reject when logout', async () => {
		try {
			await getChatJewels.resolve!({}, {}, { sessionOwner: undefined } as any, {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
		}
	});

	test('empty when no user conversations found', async () => {
		const sessionOwner = makeUser();
		const res = await getChatJewels.resolve!({}, {}, fakeCtx({ sessionOwner }), {} as any);
		expect(res).toEqual({
			conversationCount: 0,
			draftCount: 0,
			unreadCount: 0,
		});
	});

	test('correct response', async () => {
		const sessionOwner = makeUser();

		const msg = new MessageModel({
			author: sessionOwner,
			conversation: mongoose.Types.ObjectId(),
			content: faker.lorem.words(2),
		});

		const emptyConv = new ConversationModel({
			users: [sessionOwner],
			messages: [msg],
			seen: [],
			draft: [],
			significantlyUpdatedAt: new Date(),
		});
		const convSeen = new ConversationModel({
			users: [sessionOwner],
			messages: [msg],
			seen: [{
				user: sessionOwner._id,
				time: new Date() // now
			}],
			draft: [{
				user: sessionOwner._id,
				content: '',
			}],
			significantlyUpdatedAt: new Date(0), // 1970
		});
		const convUnseen = new ConversationModel({
			users: [sessionOwner],
			messages: [msg],
			seen: [{
				user: sessionOwner._id,
				time: new Date(0) // 1970
			}],
			draft: [{
				user: sessionOwner._id,
				content: faker.lorem.words(2),
			}],
			significantlyUpdatedAt: new Date(), // now
		});

		await Promise.all([
			ConversationModel.create([emptyConv, convSeen, convUnseen]),
			msg.save(),
		]);

		const res = await getChatJewels.resolve!({}, {}, fakeCtx({ sessionOwner }), {} as any);
		expect(res).toMatchObject({
			conversationCount: 3,
			draftCount: 1,
			unreadCount: 2
		});
	});

});
