import 'ts-jest';
import { Types } from 'mongoose';
import { ValidationError } from 'apollo-server-core';
import { makeUser } from 'Test/utils';
import { initTestMongoose } from 'Test/initTestMongoose';
import UserModel from '../../modules/user/UserModel';
import ConversationModel from '../../modules/conversation/ConversationModel';
import { determineRealConvId } from '../conversation.utils';

describe('Conversation Utils', () => {
	let stopMongoose: () => Promise<void>;
	const users = [makeUser(), makeUser()];

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
		await UserModel.create(users);
	});
	afterAll(async () => await stopMongoose());


	test('when user id', async () => {
		const conv = new ConversationModel({ users });
		await conv.save();

		const res = await determineRealConvId(users[0].id, users[1].id);
		expect(res).toEqual(conv.id);
	});


	test('when conversation id', async () => {
		const conv = new ConversationModel({ users });
		await conv.save();

		const res = await determineRealConvId('G' + conv.id, users[1].id);
		expect(res).toEqual(conv.id);
	});

	test('no conversation error', async () => {
		try {
			await determineRealConvId(Types.ObjectId().toHexString(), users[0].id);
		} catch (e) {
			expect(e).toStrictEqual(new ValidationError('Could not determine real conversation ID'));
		}
	});

	test('too many conversations error', async () => {
		const convArr = [1, 2].map(() => new ConversationModel({ users }));
		await ConversationModel.create(convArr);

		try {
			await determineRealConvId('G' + convArr[0].id, users[1].id);
		} catch (e) {
			expect(e).toStrictEqual(new ValidationError('Too many conversations'));
		}
	});
});
