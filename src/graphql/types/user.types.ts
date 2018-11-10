import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
} from 'graphql';
import { IUser } from '../../models/user';
import { IContext } from '../../server';

export const userType = new GraphQLObjectType({
	name: 'User',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID),
			resolve: ({ _id }) => String(_id)
		},
		name: {
			type: new GraphQLNonNull(GraphQLString)
		},
		email: {
			type: new GraphQLNonNull(GraphQLString)
		},
	})
} as GraphQLObjectTypeConfig<IUser, IContext>);
