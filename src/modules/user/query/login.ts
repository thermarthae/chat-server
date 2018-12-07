import { GraphQLNonNull, GraphQLString, GraphQLFieldConfig } from 'graphql';
import { ApolloError, toApolloError } from 'apollo-server-core';
import UserType from '../UserType';
import UserModel, { UserErrors } from '../UserModel';
import { IRootValue, IContext } from '../../../server';
import { setIsAuthCookie } from '../../../utils/auth.utils';

interface ILoginArgs {
	username: string;
	password: string;
}
export const login: GraphQLFieldConfig<IRootValue, IContext, ILoginArgs> = {
	type: UserType,
	description: 'Log in',
	args: {
		username: { type: new GraphQLNonNull(GraphQLString) },
		password: { type: new GraphQLNonNull(GraphQLString) }
	},
	resolve: async ({ }, { username, password }, { req, res }) => {
		if (username.length === 0) throw new ApolloError(
			UserErrors.MissingUsernameError,
			'MissingUsernameError'
		);
		if (password.length === 0) throw new ApolloError(
			UserErrors.MissingPasswordError,
			'MissingPasswordError'
		);

		if (req!.isAuthenticated()) throw new ApolloError(
			UserErrors.AlreadyLoggedIn,
			'AlreadyLoggedIn'
		);

		const { user, error } = await UserModel.authenticate()(username, password);
		if (!user) throw new ApolloError(error!.message, error!.name);

		setIsAuthCookie(res, true);
		req!.logIn(user, err => { if (err) throw toApolloError(err); });
		return user;
	}
};
