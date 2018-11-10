import 'ts-jest';
import * as faker from 'faker';
import { messageType } from './message.types';
import UserModel from '../../models/user';

describe('Message Types', () => {
	const types = messageType.getFields();

	test('_id', () => {
		const id = faker.random.uuid();
		const res = types._id.resolve!({ _id: id }, {}, {}, {} as any);
		expect(res).toEqual(id);
	});

	test('conversation', () => {
		const conversation = 'conversation';
		const res = types.conversation.resolve!({ conversation }, {}, {}, {} as any);
		expect(res).toEqual(conversation);
	});

	describe('me', () => {
		test('true', () => {
			const author = new UserModel();
			const res = types.me.resolve!({ author }, {}, { sessionOwner: author }, {} as any);
			expect(res).toEqual(true);
		});
		test('false', () => {
			const author = new UserModel();
			const sessionOwner = new UserModel();
			const res = types.me.resolve!({ author }, {}, { sessionOwner }, {} as any);
			expect(res).toEqual(false);
		});
	});
});
