import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from 'graphql';

import UserModel from '../../models/user';
import { userType, userInputType } from '../types/user.types';
import { checkIfNoSessionOwnerErr, checkUserRightsToId } from '../../utils/access.utils';
import { IRootValue, IContext } from '../../';

export const createNewUser: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userType,
	description: 'Add new user',
	args: {
		payload: {
			type: new GraphQLNonNull(userInputType),
			description: 'User data'
		}
	},
	resolve: async ({ }, { payload }) => {
		const newUser = new UserModel(payload);
		return await UserModel.register(newUser, payload.password);
	}
};

export const removeUser: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userType,
	description: 'Remove existing user',
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
