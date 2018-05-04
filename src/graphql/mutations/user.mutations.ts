import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from 'graphql';
import bcrypt = require('bcrypt');

import UserModel from '../../models/user';
import { userType, userInputType } from '../types/user.types';
import { checkPermissions } from '../../utils/token.utils';

export const addUser: GraphQLFieldConfig<any, any, any> = {
	type: userType,
	description: 'Add new user',
	args: {
		payload: {
			type: new GraphQLNonNull(userInputType),
			description: 'User data'
		}
	},
	resolve: async (source, { payload }) => {
		const newUser = new UserModel({
			...payload,
			password: bcrypt.hashSync(payload.password, 10)
		});

		return await newUser.save().catch(err => {
			throw new Error('Error adding new user');
		});
	}
};

export const removeUser: GraphQLFieldConfig<any, any, any> = {
	type: userType,
	description: 'Remove existing user',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'User ID'
		}
	},
	resolve: async (source, { id }) => {
		checkPermissions(id, source);

		return await UserModel.findByIdAndRemove(id).catch(err => {
			throw new Error('Error removing user');
		});
	}
};

export const updateUser: GraphQLFieldConfig<any, any, any> = {
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
	resolve: async (source, { id, payload }) => {
		checkPermissions(id, source);

		return await UserModel.findByIdAndUpdate(
			id,
			{ $set: { ...payload } },
			{ new: true }
		).catch(err => {
			throw new Error('Error updating user');
		});
	}
};
