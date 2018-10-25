import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
} from 'graphql';

import UserModel from '../../models/user';
import { userType } from '../types/user.types';
import { checkIfNoSessionOwnerErr, checkUserRightsToId } from '../../utils/access.utils';
import { IRootValue, IContext } from '../../';

export const register: GraphQLFieldConfig<IRootValue, IContext> = {
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
		const newUser = new UserModel(payload);
		return await UserModel.register(newUser, payload.password);
	}
};

export const deleteUserAccount: GraphQLFieldConfig<IRootValue, IContext> = {
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
