import 'ts-jest';
import * as faker from 'faker';
import { initTestMongoose } from 'Test/initTestMongoose';
import UserModel, { UserErrors } from '../../../user/UserModel';
import ConversationModel from '../../ConversationModel';
import { ForbiddenError, UserInputError, ApolloError, ValidationError } from 'apollo-server-core';
import { fakeCtx, makeUser } from 'Test/utils';
import { initConversation } from '../initConversation';

describe('initConversation', () => {
	let stopMongoose: () => Promise<void>;

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

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

	test('error when similar conversation already exist', async () => {
		const sessionOwner = makeUser();
		const ctx = fakeCtx({ sessionOwner });
		const usersInConv = [makeUser(), makeUser()];
		await UserModel.create([sessionOwner, ...usersInConv]);

		const userIdArr = usersInConv.map(c => c.id);
		const message = faker.lorem.words(3);
		const name = faker.lorem.words(3);

		const res = await initConversation.resolve!(
			{}, { userIdArr, message, name }, ctx, {} as any
		);
		const convInDB = await ConversationModel.findById(res._id).populate(['users', 'messages']);
		expect(convInDB!.name).toEqual(res!.name);

		try {
			await initConversation.resolve!({}, { userIdArr, message, name }, ctx, {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ValidationError('Conversation already exist'));
		}
	});
});
