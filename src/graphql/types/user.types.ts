import { conversationType } from './conversation.types';
import { IUser } from '../../models/user';
import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLInputObjectType,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
	GraphQLList,
	GraphQLBoolean,
	GraphQLInt,
	GraphQLEnumType,
} from 'graphql';
import { IContext } from '../../';

export interface IUserToken {
	sub: string;
	exp?: number;
	isAdmin: boolean;
}

const userBasicType = {
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
};

export const userType = new GraphQLObjectType({
	name: 'User',
	fields: () => ({ ...userBasicType })
} as GraphQLObjectTypeConfig<any, IContext>);

export const userInConversationType = new GraphQLObjectType({
	name: 'UserInConversation',
	fields: () => ({
		...userBasicType,
		conversationData: {
			type: new GraphQLNonNull(new GraphQLObjectType({
				name: 'conversationData',
				description: 'Data of conversation that user belongs to',
				fields: () => ({
					conversationArr: {
						type: new GraphQLList(conversationType),
						description: 'Conversation that user belongs to'
					},
					conversationCount: {
						type: new GraphQLNonNull(GraphQLInt),
						description: 'Count of all conversation that user belongs to'
					},
					draftCount: {
						type: new GraphQLNonNull(GraphQLInt)
					},
					unreadCount: {
						type: new GraphQLNonNull(GraphQLInt)
					}
				})
			})),
			args: {
				filter: {
					defaultValue: 'all',
					type: new GraphQLEnumType({
						name: 'conversationFilter',
						values: {
							ALL: { value: 'all' },
							UNREAD: { value: 'unread' },
							DRAFT: { value: 'draft' },
						}
					}),
				},
			},
			resolve: async (user: IUser, { filter }, { convUsersLoader }) => {
				const userID = user._id;
				const result = await convUsersLoader.load(userID);
				const draftArr = [];
				const unreadArr = [];

				for (const conversation of result) {
					const lastMessage = conversation.messages[conversation.messages.length - 1];
					const seen = conversation.seen.find(r => r.user == userID);

					if (conversation.draft.some(d => d.user == userID)) draftArr.push(conversation);
					if (!seen || lastMessage.time > seen.time) unreadArr.push(conversation);
				}

				const conversationArr = (filter === 'unread') ? unreadArr : ((filter === 'draft') ? draftArr : result);
				return {
					conversationArr,
					conversationCount: result.length,
					draftCount: draftArr.length,
					unreadCount: unreadArr.length,
				};
			}
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
