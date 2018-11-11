import 'ts-jest';
import * as faker from 'faker';
import MongoMemoryServer from 'mongodb-memory-server';
import initMongoose from '../../initMongoose';

import { ForbiddenError, UserInputError } from 'apollo-server-core';
import UserModel, { UserErrors } from '../../models/user';
import ConversationModel, { IConversation } from '../../models/conversation';
import MessageModel from '../../models/message';
import dataloaders from '../../dataloaders';
import { getConversation, findConversation, userConversations } from './conversation.queries';

const makeUser = (admin = false) => {
	return new UserModel({
		name: faker.internet.userName(),
		email: faker.internet.email(),
		role: admin ? 'ADMIN' : 'USER',
	});
};

describe('Conversation queries', () => {
	let mongoServer: MongoMemoryServer;
	let mongoose: typeof import('mongoose'); // tslint:disable-line:whitespace

	beforeAll(async () => {
		mongoServer = new MongoMemoryServer();
		const mongoUri = await mongoServer.getConnectionString();
		mongoose = await initMongoose(mongoUri);
	});
	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	describe('getConversation', () => {
		const convError = new ForbiddenError('Conversation does not exist or access denied');

		test('response when normal rights', async () => {
			const sessionOwner = makeUser();
			const conv = new ConversationModel({ users: [sessionOwner] });
			await Promise.all([sessionOwner.save(), conv.save()]);

			const res = await getConversation.resolve!(
				{}, { id: conv.id }, { sessionOwner, ...dataloaders() }, {} as any
			);
			expect(res).toEqual(conv.toObject());
		});

		test('response when admin rights', async () => {
			const sessionOwner = makeUser(true);
			const conv = new ConversationModel();
			await conv.save();

			const res = await getConversation.resolve!(
				{}, { id: conv.id }, { sessionOwner, ...dataloaders() }, {} as any
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
					{}, { id: conv.id }, { sessionOwner: userWithoutRights, ...dataloaders() }, {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(convError);
			}
		});

		test('reject when conversation not exist', async () => {
			try {
				const sessionOwner = makeUser();
				const id = mongoose.Types.ObjectId() as any;

				await getConversation.resolve!(
					{}, { id }, { sessionOwner, ...dataloaders() }, {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(convError);
			}
		});

		test('reject when logout', async () => {
			try {
				const id = mongoose.Types.ObjectId() as any;
				await getConversation.resolve!(
					{}, { id }, { sessionOwner: undefined, ...dataloaders() }, {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
			}
		});
	});

	describe('findConversation', () => {
		let conv: IConversation;
		const msgContent = faker.lorem.words(2);
		const userWithAccess = makeUser();
		const userWithoutAccess = makeUser();

		beforeAll(async () => {
			const convID = mongoose.Types.ObjectId();
			const msg = new MessageModel({
				author: userWithAccess,
				conversation: convID,
				content: msgContent,
			});
			conv = new ConversationModel({
				_id: convID,
				name: faker.lorem.words(4),
				users: [userWithAccess],
				messages: [msg],
			});

			await Promise.all([
				UserModel.create([userWithAccess, userWithoutAccess]),
				conv.save(),
				msg.save(),
			]);
		});

		test('error when logout', async () => {
			try {
				const query = conv.name!.slice(0, 5);
				await findConversation.resolve!(
					{}, { query }, { sessionOwner: undefined } as any, {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
			}
		});

		test('finding by name', async () => {
			const query = conv.name!.slice(0, 5);
			const res: IConversation[] = await findConversation.resolve!(
				{}, { query }, { sessionOwner: userWithAccess } as any, {} as any
			);

			expect(res).not.toHaveLength(0);
			expect(res.find(c => conv._id.equals(c._id))).toBeDefined();
		});

		test('not found when logged user does not belong to the conversation', async () => {
			const query = conv.name!.slice(0, 5);
			const res: IConversation[] = await findConversation.resolve!(
				{}, { query }, { sessionOwner: userWithoutAccess } as any, {} as any
			);

			expect(res.find(c => conv._id.equals(c._id))).toBeUndefined();
		});

		test('finding by last message', async () => {
			const query = msgContent;
			const res: IConversation[] = await findConversation.resolve!(
				{}, { query }, { sessionOwner: userWithAccess } as any, {} as any
			);

			expect(res).not.toHaveLength(0);
			expect(res.find(c => conv._id.equals(c._id))).toBeDefined();
		});

		test('error when query too short', async () => {
			try {
				const query = conv.name!.slice(0, 2);
				await findConversation.resolve!(
					{}, { query }, { sessionOwner: userWithAccess } as any, {} as any
				);
			} catch (e) {
				expect(e).toStrictEqual(new UserInputError('Query must be at least 3 characters long'));
			}
		});
	});

	describe('userConversations', () => {
		const emptyResponse = {
			conversationArr: [],
			conversationCount: 0,
			draftCount: 0,
			unreadCount: 0,
		};

		test('reject when logout', async () => {
			try {
				await userConversations.resolve!({}, {}, { sessionOwner: undefined } as any, {} as any);
			} catch (e) {
				expect(e).toStrictEqual(new ForbiddenError(UserErrors.NotLoggedInForbidden));
			}
		});

		test('empty when no user conversations found', async () => {
			const sessionOwner = makeUser();
			const res = await userConversations.resolve!({}, {}, { sessionOwner } as any, {} as any);
			expect(res).toEqual(emptyResponse);
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

			const res = await userConversations.resolve!({}, {}, { sessionOwner } as any, {} as any);
			expect(res).toMatchObject({
				conversationArr: expect.arrayContaining([
					expect.objectContaining({ _id: emptyConv._id }),
					expect.objectContaining({ _id: convSeen._id }),
					expect.objectContaining({ _id: convUnseen._id })
				]),
				conversationCount: 3,
				draftCount: 1,
				unreadCount: 2
			});
		});

	});
});

