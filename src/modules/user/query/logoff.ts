import { GraphQLFieldConfig, GraphQLNonNull } from 'graphql';
import { ApolloError } from 'apollo-server-core';

import UserType from '../UserType';
import { IRootValue, IContext } from '../../../server';
import { setIsAuthCookie } from '../../../utils/auth.utils';

export const logout: GraphQLFieldConfig<IRootValue, IContext> = {
	type: new GraphQLNonNull(UserType),
	description: 'Log out',
	resolve: async ({ }, { }, { req, res }) => {
		if (req!.isUnauthenticated()) throw new ApolloError(
			'You are already logged out',
			'AlreadyLoggedOut'
		);

		const user = req!.user;
		setIsAuthCookie(res, false);
		req!.logOut();
		return user;
	}
};
