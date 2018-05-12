import ConversationModel from '../../models/conversation';
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
		conversationData: {
			type: new GraphQLNonNull(new GraphQLObjectType({
				name: 'conversationData',
				fields: () => ({
					idsArr: {
						type: new GraphQLList(GraphQLString),
						description: 'ID of conversation that user belongs to'
					},
					count: {
						type: new GraphQLNonNull(GraphQLInt),
						description: 'Count of conversation that user belongs to'
					}
				})
			})),
			resolve: async (user: IUser) => {
				const result = await ConversationModel.find({ users: { $all: user._id } }, '_id');
				const idsArr = result.map(conv => conv._id);
				return {
					idsArr,
					count: idsArr.length
				};
			}
		},
		draftData: {
			type: new GraphQLNonNull(new GraphQLObjectType({
				name: 'draftData',
				fields: () => ({
					idsArr: {
						type: new GraphQLList(GraphQLString),
						description: 'ID of conversation with user draft messages'
					},
					count: {
						type: new GraphQLNonNull(GraphQLInt),
						description: 'Count of conversation with user draft messages'
					}
				})
			})),
			resolve: async (user: IUser) => {
				const result = await ConversationModel.find({ 'draft._id': { $all: user._id } }, '_id');
				const idsArr = result.map(conv => conv._id);
				return {
					idsArr,
					count: idsArr.length
				};
			}
		},
		isAdmin: {
			type: new GraphQLNonNull(GraphQLBoolean)
		},
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
