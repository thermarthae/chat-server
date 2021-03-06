import * as faker from 'faker';
import UserModel, { IUser } from '../src/modules/user/UserModel';
import createDataloaders from '../src/dataloaders';
import { GraphQLFieldMap } from 'graphql';
import { IContext } from 'src/server';

export type TFieldMap<TSource = any> = GraphQLFieldMap<TSource, Partial<IContext>>;

export const fakeCtx = (arg: {
	sessionOwner?: IUser | undefined,
	req?: any,
	res?: any
} = {}) => ({
	req: {},
	res: {},
	sessionOwner: undefined,
	...createDataloaders(),
	...arg,
});

export const makeUser = (admin = false) => {
	return new UserModel({
		name: faker.internet.userName(),
		email: faker.internet.email(),
		role: admin ? 'ADMIN' : 'USER',
	});
};

export const parseObj = (obj: object) => JSON.parse(JSON.stringify(obj));
