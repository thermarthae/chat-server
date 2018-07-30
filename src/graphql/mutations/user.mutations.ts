import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from 'graphql';
import bcrypt = require('bcrypt');

import UserModel from '../../models/user';
import { userType, userInputType } from '../types/user.types';
import { checkIfNoTokenOwnerErr, checkUserRightsToId } from '../../utils/access.utils';
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
	resolve: async ({}, { payload }) => {
		const newUser = new UserModel({
			...payload,
			password: bcrypt.hashSync(payload.password, 10)
		});

		return await newUser.save();
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
	resolve: async ({}, { id }, { tokenOwner }) => {
		const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
		checkUserRightsToId(id, verifiedUser);
		return await UserModel.findByIdAndRemove(id);
	}
};

export const updateUser: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userType,
	description: 'Update user data',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'User ID'
		},
		payload: {
			type: new GraphQLNonNull(userInputType),
			description: 'user updated data'
		}
	},
	resolve: async ({}, { id, payload }, { tokenOwner }) => {
		const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
		checkUserRightsToId(id, verifiedUser);

		return await UserModel.findByIdAndUpdate(
			id,
			{ $set: { ...payload } },
			{ new: true }
		);
	}
};
