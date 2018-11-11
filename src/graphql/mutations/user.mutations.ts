import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
} from 'graphql';
import { ApolloError } from 'apollo-server-core';

import UserModel, { UserErrors } from '../../models/user';
import { userType } from '../types/user.types';
import { checkIfNoSessionOwnerErr, checkUserRightsToId } from '../../utils/access.utils';
import { IRootValue, IContext } from '../../server';

interface IRegisterArgs {
	name: string;
	email: string;
	password: string;
}
export const register: GraphQLFieldConfig<IRootValue, IContext, IRegisterArgs> = {
	type: userType,
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
		});
	}
};

export const deleteUserAccount: GraphQLFieldConfig<IRootValue, IContext, { id: string }> = {
	type: userType,
	description: 'Delete user account',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'User ID'
		}
	},
	resolve: async ({ }, { id }, { sessionOwner }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		checkUserRightsToId(id, verifiedUser);
		return await UserModel.findByIdAndRemove(id);
	}
};
