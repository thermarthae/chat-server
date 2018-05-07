import PostModel from '../../models/post';
import ConversationModel from '../../models/conversation';
import { postType } from './post.types';
import { IUser } from '../../models/user';
import {
	GraphQLObjectType,
	GraphQLInputObjectType,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
	GraphQLList,
	GraphQLBoolean,
	GraphQLInt
} from 'graphql';

export interface IUserToken {
	_id: string;
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
		conversations: {
			type: new GraphQLList(GraphQLString),
			resolve: async (con: IUser) => {
				const users = await ConversationModel.find({ users: { $all: con._id } }, '_id');
				const UsersIdArr = [];
				for (const user of users) UsersIdArr.push(user._id);

				return UsersIdArr;
			}
		},
		isAdmin: {
			type: new GraphQLNonNull(GraphQLBoolean)
		},
		posts: {
			type: new GraphQLList(postType),
			resolve: async (user: IUser) => await PostModel.find({ uid: user._id })
		}
	})
});

export const userTokenType = new GraphQLObjectType({
	name: 'UserToken',
	fields: () => ({
		user: {
			type: userType
		},
		access_token: {
			type: GraphQLString
		},
		refresh_token: {
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
