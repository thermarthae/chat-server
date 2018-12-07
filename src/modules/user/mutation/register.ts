import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLString,
} from 'graphql';
import { ApolloError } from 'apollo-server-core';

import UserModel, { UserErrors } from '../UserModel';
import UserType from '../UserType';
import { IRootValue, IContext } from '../../../server';

interface IRegisterArgs {
	name: string;
	email: string;
	password: string;
}
export const register: GraphQLFieldConfig<IRootValue, IContext, IRegisterArgs> = {
	type: UserType,
	description: 'Register new user',
	args: {
		name: {
			type: new GraphQLNonNull(GraphQLString)
		},
		email: {
			type: new GraphQLNonNull(GraphQLString)
		},
		password: {
			type: new GraphQLNonNull(GraphQLString)
		},
	},
	resolve: async ({ }, payload) => {
		if (payload.email.length < 3) throw new ApolloError(
			UserErrors.UsernameIsTooShort,
			'UsernameIsTooShort'
		);
		if (payload.password.length < 8) throw new ApolloError(
			UserErrors.PasswordIsTooShort,
			'PasswordIsTooShort'
		);

		const newUser = new UserModel(payload);
		return await UserModel.register(newUser, payload.password).catch(err => {
			if (err.message === UserErrors.UserExistsError) err.name = 'UserExistsError';
			throw new ApolloError(err.message, err.name);
		});
	}
};
