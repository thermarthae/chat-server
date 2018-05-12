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
				description: 'Data of conversation that user belongs to',
				fields: () => ({
					conversationIdArr: {
						type: new GraphQLList(GraphQLString),
						description: 'IDs of conversation that user belongs to'
					},
					draftIdArr: {
						type: new GraphQLList(GraphQLString),
					},
					unreadIdArr: {
						type: new GraphQLList(GraphQLString),
					},
					conversationCount: {
						type: new GraphQLNonNull(GraphQLInt),
						description: 'Count of conversation that user belongs to'
					},
					draftCount: {
						type: new GraphQLNonNull(GraphQLInt)
					},
					unreadCount: {
						type: new GraphQLNonNull(GraphQLInt)
					}
				})
			})),
			resolve: async (user: IUser) => {
				const userID = user._id;
				const result = await ConversationModel.find({ users: { $all: userID } }, '_id messages draft seen').cache(10);
				const conversationIdArr = result.map(conv => conv._id);
				const draftIdArr = [];
				const unreadIdArr = [];

				for (const conversation of result) {
					if (conversation.draft.some(d => d._id == userID)) // tslint:disable-line:triple-equals
						draftIdArr.push(conversation._id);

					const lastMessage = conversation.messages[conversation.messages.length - 1];
					const seen = conversation.seen.find(r => r.user === userID);
					if (!seen || lastMessage.time > seen.time)
						unreadIdArr.push(conversation._id);
				}

				return {
					conversationIdArr,
					draftIdArr,
					unreadIdArr,
					conversationCount: conversationIdArr.length,
					draftCount: draftIdArr.length,
					unreadCount: unreadIdArr.length,
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
