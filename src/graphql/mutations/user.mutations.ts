import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
} from 'graphql';

import UserModel, { UserErrors } from '../../models/user';
import { userType } from '../types/user.types';
import { checkIfNoSessionOwnerErr, checkUserRightsToId } from '../../utils/access.utils';
import { IRootValue, IContext } from '../../';
import { ApolloError } from 'apollo-server-core';

interface IRegisterArgs {
	name: string;
	message: string;
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
		if (payload.password.length < 8) throw new ApolloError(
			'Password is too short (minimum is 8 characters)',
			UserErrors.PasswordIsTooShort as any,
			{ name: 'PasswordIsTooShort' }
		);
		const newUser = new UserModel(payload);
		return await UserModel.register(newUser, payload.password);
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
