import 'ts-jest';
import * as faker from 'faker';
import { initTestMongoose } from 'Test/initTestMongoose';

import { ForbiddenError, UserInputError } from 'apollo-server-core';
import UserModel, { UserErrors } from '../../../user/UserModel';
import ConversationModel, { IConversation } from '../../ConversationModel';
import MessageModel from '../../../message/MessageModel';
import { makeUser } from 'Test/utils';
import { findConversation } from '../findConversation';

describe('findConversation', () => {
	let mongoose: typeof import('mongoose'); // tslint:disable-line:whitespace
	let stopMongoose: () => Promise<void>;

	let conv: IConversation;
	const msgContent = faker.lorem.words(2);
	const userWithAccess = makeUser();
	const userWithoutAccess = makeUser();

	beforeAll(async () => {
		({ stopMongoose, mongoose } = await initTestMongoose());

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
	afterAll(async () => await stopMongoose());

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
