import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
	GraphQLBoolean,
} from 'graphql';
import { IUser } from '../../models/user';
import { IContext } from '../../';

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
		isAdmin: {
			type: new GraphQLNonNull(GraphQLBoolean)
		},
	})
} as GraphQLObjectTypeConfig<IUser, IContext>);
