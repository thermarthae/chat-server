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
import { checkIfTokenError, makeNewTokens, setTokenCookies, renewTokens } from '../../utils/token.utils';

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
	resolve: async ({ }, { id }, { verifiedToken, loaders }) => {
		checkIfTokenError(verifiedToken);
		return await loaders.userLoader.load(id);
	}
};

export const currentUser: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userType,
	description: 'Get current user data',
	resolve: async ({ }, { }, { verifiedToken, loaders }) => {
		checkIfTokenError(verifiedToken);
		return await loaders.userLoader.load(verifiedToken!.sub);
	}
};

export const getAccess: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userTokenType,
	description: 'Get access and refresh token',
	args: {
		username: { type: new GraphQLNonNull(GraphQLString) },
		password: { type: new GraphQLNonNull(GraphQLString) }
	},
	resolve: async ({}, { username, password }, { res }) => {
		const userFromDB = await UserModel.findOne({ email: username }).cache(10);
		if (!userFromDB) return {
			error: {
				code: Errors.userNotFound,
				message: 'User not found'
			}
		};

		const validPassword = await bcrypt.compare(password, userFromDB.password);
		if (!validPassword) return {
			error: {
				code: Errors.wrongPassword,
				message: 'Wrong password'
			}
		};

		const newTokens = await makeNewTokens(userFromDB);
		setTokenCookies(res, newTokens);
		return newTokens;
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
	resolve: async ({}, { refreshToken }, { res, loaders }) => {
		const newTokens = await renewTokens(loaders, refreshToken);

		setTokenCookies(res, newTokens);
		return newTokens;
	}
};
