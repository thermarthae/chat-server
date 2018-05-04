import bcrypt = require('bcrypt');
import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLString,
	GraphQLList,
	GraphQLFieldConfig
} from 'graphql';

import { userType, userTokenType } from '../types/user.types';
import UserModel from '../../models/user';
import { IRootValue } from '../../';
import {
	makeAccessToken,
	makeRefreshToken,
	checkToken,
	checkRefreshToken,
	makeNewTokenSignature
} from '../../utils/token.utils';

enum Errors {
	userNotFound = 100,
	usersNotFound = 101,
	wrongPassword = 200,
	unknown = 999,
}

export const getAllUsers: GraphQLFieldConfig<IRootValue, any, any> = {
	type: new GraphQLList(userType),
	description: 'Get all users',
	resolve: async source => {
		checkToken(source);

		return await UserModel.find().catch(err => {
			throw new Error('Error getting users');
		});
	}
};

export const getUser: GraphQLFieldConfig<IRootValue, any, any> = {
	type: userType,
	description: 'Get user by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'User ID'
		}
	},
	resolve: async (source, { id }) => {
		checkToken(source);
		return await UserModel.findById(id).catch(err => {
			throw new Error('Error getting user');
		});
	}
};

export const getAccess: GraphQLFieldConfig<IRootValue, any, any> = {
	type: userTokenType,
	description: 'Get access and refresh token',
	args: {
		username: { type: new GraphQLNonNull(GraphQLString) },
		password: { type: new GraphQLNonNull(GraphQLString) }
	},
	resolve: async ({ secretKey }, { username, password }) => {
		const userFromDB = await UserModel.findOne({ email: username });
		if (!userFromDB) return {
			error: {
				code: Errors.userNotFound,
				message: 'User not found'
			}
		};

		const validData = bcrypt.compareSync(password, userFromDB.password);
		if (!validData) return {
			error: {
				code: Errors.wrongPassword,
				message: 'Wrong password'
			}
		};

		const newTokenSignature = await makeNewTokenSignature(userFromDB._id);

		const payload = {
			_id: userFromDB._id,
			isAdmin: userFromDB.isAdmin
		};

		return {
			user: userFromDB,
			access_token: await makeAccessToken(payload, secretKey.primary),
			refresh_token: await makeRefreshToken(
				payload,
				secretKey.secondary,
				userFromDB.password + newTokenSignature
			)
		};
	}
};

export const refreshAccess: GraphQLFieldConfig<IRootValue, any, any> = {
	type: userTokenType,
	description: 'Get new access and refresh token',
	args: {
		refreshToken: {
			type: new GraphQLNonNull(GraphQLString),
			description: 'Refresh token'
		}
	},
	resolve: async ({ secretKey }, { refreshToken }) => {
		const tokenOwner = await checkRefreshToken(
			secretKey.secondary,
			refreshToken
		);
		const newTokenSignature = await makeNewTokenSignature(tokenOwner._id);

		const payload = {
			_id: tokenOwner._id,
			isAdmin: tokenOwner.isAdmin
		};

		return {
			access_token: await makeAccessToken(payload, secretKey.primary),
			refresh_token: await makeRefreshToken(
				payload,
				secretKey.secondary,
				tokenOwner.password + newTokenSignature
			)
		};
	}
};
