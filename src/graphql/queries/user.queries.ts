import bcrypt = require('bcrypt');
import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLString,
	GraphQLFieldConfig
} from 'graphql';

import { userType, userTokenType } from '../types/user.types';
import UserModel from '../../models/user';
import { IRootValue, IContext } from '../../';
import TokenUtils from '../../utils/token.utils';

enum Errors {
	userNotFound = 100,
	usersNotFound = 101,
	wrongPassword = 200,
	unknown = 999,
}

export const getUser: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userType,
	description: 'Get user by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'User ID'
		}
	},
	resolve: async ({}, { id }, { verifiedToken }) => {
		TokenUtils.checkIfAccessTokenIsVerified(verifiedToken);

		return await UserModel.findById(id).cache(10).catch(err => {
			throw new Error('Error getting user');
		});
	}
};

export const currentUser: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userType,
	description: 'Get current user data',
	resolve: async ({}, {}, { verifiedToken }) => {
		TokenUtils.checkIfAccessTokenIsVerified(verifiedToken);

		return await UserModel.findById(verifiedToken._id).cache(10).catch(err => {
			throw new Error('Getting user error');
		});
	}
};

export const getAccess: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userTokenType,
	description: 'Get access and refresh token',
	args: {
		username: { type: new GraphQLNonNull(GraphQLString) },
		password: { type: new GraphQLNonNull(GraphQLString) }
	},
	resolve: async ({ secretKey }, { username, password }) => {
		const userFromDB = await UserModel.findOne({ email: username }).cache(10);
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

		const newTokenSignature = await TokenUtils.newTokenSignature(userFromDB._id);

		const payload = {
			_id: userFromDB._id,
			isAdmin: userFromDB.isAdmin
		};

		return {
			access_token: await TokenUtils.newAccessToken(payload, secretKey.primary),
			refresh_token: await TokenUtils.newRefreshToken(
				payload,
				secretKey.secondary,
				userFromDB.password + newTokenSignature
			)
		};
	}
};

export const refreshAccess: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userTokenType,
	description: 'Get new access and refresh token',
	args: {
		refreshToken: {
			type: new GraphQLNonNull(GraphQLString),
			description: 'Refresh token'
		}
	},
	resolve: async ({ secretKey }, { refreshToken }) => {
		const tokenOwner = await TokenUtils.verifyRefreshToken(
			secretKey.secondary,
			refreshToken
		);
		const newTokenSignature = await TokenUtils.newTokenSignature(tokenOwner._id);

		const payload = {
			_id: tokenOwner._id,
			isAdmin: tokenOwner.isAdmin
		};

		return {
			access_token: await TokenUtils.newAccessToken(payload, secretKey.primary),
			refresh_token: await TokenUtils.newRefreshToken(
				payload,
				secretKey.secondary,
				tokenOwner.password + newTokenSignature
			)
		};
	}
};
