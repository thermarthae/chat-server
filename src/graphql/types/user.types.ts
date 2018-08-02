import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLInputObjectType,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
	GraphQLBoolean,
	GraphQLInt,
} from 'graphql';
import { IContext } from '../../';

export interface IUserToken {
	sub: string;
	exp?: number;
	isAdmin: boolean;
}

export const userType = new GraphQLObjectType({
	name: 'User',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		name: {
			type: new GraphQLNonNull(GraphQLString)
		},
		email: {
			type: new GraphQLNonNull(GraphQLString)
		},
		// password: {
		// 	type: new GraphQLNonNull(GraphQLString)
		// },
		isAdmin: {
			type: new GraphQLNonNull(GraphQLBoolean)
		},
	})
} as GraphQLObjectTypeConfig<any, IContext>);

export const userTokenType = new GraphQLObjectType({
	name: 'UserToken',
	fields: () => ({
		access_token: {
			type: GraphQLString
		},
		refresh_token: {
			type: GraphQLString
		},
		sign_token: {
			type: GraphQLString
		},
		error: {
			type: new GraphQLObjectType({
				name: 'UserTokenError',
				fields: () => ({
					code: { type: GraphQLInt },
					message: { type: GraphQLString }
				})
			})
		}
	})
});

export const userInputType = new GraphQLInputObjectType({
	name: 'UserInput',
	fields: () => ({
		name: {
			type: new GraphQLNonNull(GraphQLString)
		},
		email: {
			type: new GraphQLNonNull(GraphQLString)
		},
		password: {
			type: new GraphQLNonNull(GraphQLString)
		},
	})
});
