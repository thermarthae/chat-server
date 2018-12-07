import 'ts-jest';
import * as faker from 'faker';
import { initTestMongoose } from 'Test/initTestMongoose';
import UserModel, { UserErrors } from '../../UserModel';
import { ApolloError, } from 'apollo-server-core';
import { fakeCtx } from 'Test/utils';
import { register } from '../register';

describe('register', () => {
	let stopMongoose: () => Promise<void>;

	beforeAll(async () => {
		({ stopMongoose } = await initTestMongoose());
	});
	afterAll(async () => await stopMongoose());

	test('success', async () => {
		const payload = {
			name: faker.internet.userName(),
			email: faker.internet.email(),
			password: 'password',
		};

		const res = await register.resolve!({}, payload, fakeCtx(), {} as any);
		const userInDB = await UserModel.findById(res._id);
		expect(res.toObject()).toEqual(userInDB!.toObject());
	});

	test('error when password is too short', async () => {
		try {
			const payload = {
				name: faker.internet.userName(),
				email: faker.internet.email(),
				password: '1234567',
			};
			await register.resolve!({}, payload, fakeCtx(), {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ApolloError(UserErrors.PasswordIsTooShort, 'PasswordIsTooShort'));
		}
	});

	test('error when username is too short', async () => {
		try {
			const payload = {
				name: faker.internet.userName(),
				email: '12',
				password: 'password',
			};
			await register.resolve!({}, payload, fakeCtx(), {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ApolloError(UserErrors.UsernameIsTooShort, 'UsernameIsTooShort'));
		}
	});

	test('error when username is already registered', async () => {
		try {
			const payload = {
				name: faker.internet.userName(),
				email: faker.internet.email(),
				password: 'password',
			};
			await register.resolve!({}, payload, fakeCtx(), {} as any);

			const newPayload = Object.assign({}, payload, { name: faker.internet.userName() });
			await register.resolve!({}, newPayload, fakeCtx(), {} as any);
		} catch (e) {
			expect(e).toStrictEqual(new ApolloError(UserErrors.UserExistsError, 'UserExistsError'));
		}
	});
});
