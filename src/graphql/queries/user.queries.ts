import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLString,
	GraphQLFieldConfig,
	GraphQLList
} from 'graphql';
import { ApolloError, UserInputError } from 'apollo-server-core';

import { userType } from '../types/user.types';
import UserModel, { UserErrors } from '../../models/user';
import { IRootValue, IContext } from '../../';
import { checkIfNoSessionOwnerErr, checkUserRightsToId } from '../../utils/access.utils';

export const getUser: GraphQLFieldConfig<IRootValue, IContext, { id: string }> = {
	type: userType,
	description: 'Get user by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'User ID'
		}
	},
	resolve: async ({ }, { id }, { sessionOwner, userIDLoader }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		checkUserRightsToId(id, verifiedUser);
		return await userIDLoader.load(id);
	}
};

export const findUser: GraphQLFieldConfig<IRootValue, IContext, { query: string }> = {
	type: new GraphQLList(userType),
	description: 'Find user',
	args: { query: { type: new GraphQLNonNull(GraphQLString) } },
	resolve: async ({ }, { query }, { sessionOwner }) => {
		checkIfNoSessionOwnerErr(sessionOwner);
		if (query.length < 3) throw new UserInputError('Query must be at least 3 characters long');
		return await UserModel.find({ name: { $regex: query, $options: 'i' } }).cache(30);
	}
};

export const currentUser: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userType,
	description: 'Get current user data',
	resolve: ({ }, { }, { sessionOwner }) => checkIfNoSessionOwnerErr(sessionOwner)
};

interface ILoginArgs {
	username: string;
	password: string;
}
export const login: GraphQLFieldConfig<IRootValue, IContext, ILoginArgs> = {
	type: userType,
	description: 'Log in',
	args: {
		username: { type: new GraphQLNonNull(GraphQLString) },
		password: { type: new GraphQLNonNull(GraphQLString) }
	},
	resolve: async ({ }, { username, password }, { req }) => {
		if (req.isAuthenticated()) throw new ApolloError(
			UserErrors.AlreadyLoggedIn,
			'AlreadyLoggedIn'
		);

		const { user, error } = await UserModel.authenticate()(username, password);
		if (!user) throw new ApolloError(error!.message, error!.name);

		req.logIn(user, err => {
			if (err) throw new ApolloError(err.message, err.name);
		});
		return user;
	}
};

export const logout: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userType,
	description: 'Log out',
	resolve: async ({ }, { }, { req }) => {
		if (req.isUnauthenticated()) throw new ApolloError(
			'You are already logged out',
			'AlreadyLoggedOut'
		);

		const user = req.user;
		req.logOut();
		return user;
	}
};
