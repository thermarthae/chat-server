import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
	GraphQLList,
	GraphQLBoolean,
	GraphQLInt,
} from 'graphql';
import { IConversation } from '../../models/conversation';
import { IMessage } from '../../models/message';
import { userType } from './user.types';
import { IContext } from '../../';

export const messageType = new GraphQLObjectType({
	name: 'Message',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		author: {
			type: new GraphQLNonNull(userType)
		},
		conversation: {
			type: new GraphQLNonNull(GraphQLString)
		},
		time: {
			type: new GraphQLNonNull(GraphQLString)
		},
		content: {
			type: GraphQLString
		},
		me: {
			type: new GraphQLNonNull(GraphQLBoolean)
		},
	})
});

const messagesType = new GraphQLObjectType({
	name: 'Messages',
	fields: () => ({
		cursor: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Message ID cursor',
			resolve: (messages: [IMessage]) => messages[0]._id
		},
		data: {
			type: new GraphQLNonNull(new GraphQLList(messageType)),
			resolve: (messages: [IMessage]) => messages
		}
	})
});

export const conversationType = new GraphQLObjectType({
	name: 'Conversation',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		name: {
			type: GraphQLString,
			resolve: ({ name, users }: IConversation, { }, { tokenOwner }) => {
				if (name) return name;
				const usersWithoutCurrent = users!.filter(user => String(user._id) != String(tokenOwner!._id));
				const usersName = usersWithoutCurrent.map(user => user.name);
				return usersName.join(', ');
			}
		},
		users: {
			type: new GraphQLNonNull(new GraphQLList(userType)),
			resolve: async (conversation: IConversation, { }, { tokenOwner }) => {
				const { users } = await conversation.populate('users').execPopulate();
				const usersWithoutCurrent = users!.filter(user => String(user._id) != String(tokenOwner!._id));
				return usersWithoutCurrent;
			}
		},
		seen: {
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: ({ seen, messages }: IConversation, { }, { tokenOwner }) => {
				const seenByUser = seen.find(s => String(s.user) == String(tokenOwner!._id));
				if (!seenByUser) return false;
				const messageArr = messages!.slice().reverse(); // duplicate arr then reverse
				const unreaded = messageArr.find(msg => msg.time > seenByUser.time);
				if (unreaded) return false;
				return true;
			}
		},
		draft: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: ({ draft }: IConversation, { }, { tokenOwner }) => {
				const userDraft = draft.find(draftObj => String(draftObj.user) == String(tokenOwner!._id));
				if (!userDraft) return '';
				return userDraft.content;
			}
		},
		messages: {
			type: new GraphQLNonNull(messagesType),
			args: {
				first: {
					type: new GraphQLNonNull(GraphQLInt),
					description: 'Number of messages to fetch (limit)'
				},
				cursor: {
					type: GraphQLID,
					description: 'Message ID cursor'
				},
			},
			resolve: async (conversation: IConversation, { first, cursor }, { tokenOwner }) => {
				const { messages } = await conversation.populate({
					path: 'messages',
					options: {
						sort: { _id: -1 },
						limit: first,
						match: { _id: { $lt: cursor || 'ffffffffffffffffffffffff' } }
					},
					populate: { path: 'author' }
				}).execPopulate();
				messages!.reverse();

				const messagesFromDB = [];
				for (const message of messages!) {
					const me = String(message.author._id) == String(tokenOwner!._id) ? true : false;
					messagesFromDB.push(Object.assign(message, { me, author: message.author }));
				}
				return messagesFromDB;
			}
		}
	})
} as GraphQLObjectTypeConfig<any, IContext>);

export const userConversationsCountType = new GraphQLObjectType({
	name: 'userConversationsCount',
	description: 'Count of current user conversations',
	fields: () => ({
		conversationCount: {
			type: new GraphQLNonNull(GraphQLInt)
		},
		draftCount: {
			type: new GraphQLNonNull(GraphQLInt)
		},
		unreadCount: {
			type: new GraphQLNonNull(GraphQLInt)
		}
	})
} as GraphQLObjectTypeConfig<any, IContext>);
