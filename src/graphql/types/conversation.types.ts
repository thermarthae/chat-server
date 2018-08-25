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
import mongoose = require('mongoose');
import { IConversation } from '../../models/conversation';
import MessageModel, { IMessage } from '../../models/message';
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
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: ({ author }: IMessage, { }, { tokenOwner }) => tokenOwner!._id.equals(author._id) ? true : false
		},
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
				const usersWithoutCurrent = users!.filter(user => !tokenOwner!._id.equals(user._id));
				const usersName = usersWithoutCurrent.map(user => user.name);
				return usersName.join(', ');
			}
		},
		users: {
			type: new GraphQLNonNull(new GraphQLList(userType)),
			resolve: ({ users }: IConversation, { }, { tokenOwner }) =>
				users!.filter(user => !tokenOwner!._id.equals(user._id))
		},
		seen: {
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: ({ seen, messages }: IConversation, { }, { tokenOwner }) => {
				const userS = Array.isArray(seen) ? seen.find(s => tokenOwner!._id.equals(s.user)) : seen;
				return userS && !messages!.find(msg => msg.time > userS.time) ? true : false;
			}
		},
		draft: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: ({ draft }: IConversation, { }, { tokenOwner }) => {
				const userD = Array.isArray(draft) ? draft.find(d => tokenOwner!._id.equals(d.user)) : draft;
				return !userD ? '' : userD.content;
			}
		},
		messages: {
			type: new GraphQLNonNull(new GraphQLList(messageType)),
			args: {
				limit: {
					type: new GraphQLNonNull(GraphQLInt),
					description: 'Number of messages to fetch'
				},
				skip: {
					type: new GraphQLNonNull(GraphQLInt),
					description: 'Cursor'
				},
			},
			resolve: async ({ _id, messages, users }: IConversation, { skip, limit }) => {
				if (!messages![0].time) {
					messages = await MessageModel.aggregate([
						{ $match: { conversation: mongoose.Types.ObjectId(_id as any) } },
						{ $sort: { _id: -1 } },
						{ $skip: skip },
						{ $limit: limit },
						{ $sort: { _id: 1 } }
					]).cache(10) as any;
					if (!messages![0]) throw new Error('404 (Not Found)');
				}
				else messages = messages!.reverse().splice(skip, limit).reverse();

				messages!.forEach(msg =>
					msg.author = users!.find(usr => String(usr._id) == String(msg.author._id || msg.author))!
				);
				return messages!;
			}
		}
	})
} as GraphQLObjectTypeConfig<any, IContext>);

export const userConversationsType = new GraphQLObjectType({
	name: 'userConversations',
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
} as GraphQLObjectTypeConfig<any, IContext>);
