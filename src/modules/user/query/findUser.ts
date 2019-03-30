import { GraphQLNonNull, GraphQLString, GraphQLFieldConfig, GraphQLList } from 'graphql';
import { UserInputError } from 'apollo-server-core';
import UserType from '../UserType';
import UserModel from '../UserModel';
import { IRootValue, IContext } from '../../../server';
import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';

export const findUser: GraphQLFieldConfig<IRootValue, IContext, { query: string }> = {
	type: new GraphQLNonNull(new GraphQLList(UserType)),
	description: 'Find user',
	args: { query: { type: new GraphQLNonNull(GraphQLString) } },
	resolve: async ({ }, { query }, { sessionOwner }) => {
		checkIfNoSessionOwnerErr(sessionOwner);
		if (query.length < 3) throw new UserInputError('Query must be at least 3 characters long');
		return await UserModel.find({ name: { $regex: query, $options: 'i' } }).cache(30);
	}
};
