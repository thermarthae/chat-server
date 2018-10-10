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
import MessageModel from '../../models/message';
import { userType } from './user.types';
import { messageType } from './message.types';
import { IContext } from '../../';

export const conversationType = new GraphQLObjectType({
	name: 'Conversation',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID),
			resolve: ({ _id }) => String(_id)
		},
		name: {
			type: GraphQLString,
			resolve: ({ name, users }, { }, { tokenOwner }) => {
				if (name) return name;
				const usersWithoutCurrent = users!.filter(user => !tokenOwner!._id.equals(user._id));
				const usersName = usersWithoutCurrent.map(user => user.name);
				return usersName.join(', ');
			}
		},
		users: {
			type: new GraphQLNonNull(new GraphQLList(userType)),
			resolve: ({ users }, { }, { tokenOwner }) =>
				users!.filter(user => !tokenOwner!._id.equals(user._id))
		},
		seen: {
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: ({ seen, messages }, { }, { tokenOwner }) => {
				const userS = Array.isArray(seen) ? seen.find(s => tokenOwner!._id.equals(s.user)) : seen;
				return userS && !messages!.find(msg => msg.time > userS.time) ? true : false;
			}
		},
		draft: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: ({ draft }, { }, { tokenOwner }) => {
				const userD = Array.isArray(draft) ? draft.find(d => tokenOwner!._id.equals(d.user)) : draft;
				return !userD ? '' : userD.content;
			}
		},
		messages: {
			type: new GraphQLList(messageType),
			args: {
				limit: {
					type: new GraphQLNonNull(GraphQLInt),
					description: 'Number of messages to fetch'
				},
				skip: {
					type: GraphQLInt,
					description: 'Messages to skip (cursor)',
					defaultValue: 0
				},
			},
			resolve: async ({ _id, messages, users }, { skip, limit }) => {
				if (!messages![0].time) {
					messages = await MessageModel.aggregate([
						{ $match: { conversation: mongoose.Types.ObjectId(_id as any) } },
						{ $sort: { _id: -1 } },
						{ $skip: skip },
						{ $limit: limit },
						{ $sort: { _id: 1 } }
					]);
					if (!messages![0]) return null;
				}
				else messages = messages!.reverse().splice(skip, limit).reverse();

				messages!.forEach(msg =>
					msg.author = users!.find(usr => String(usr._id) == String(msg.author._id || msg.author))!
				);
				return messages!;
			}
		}
	})
} as GraphQLObjectTypeConfig<IConversation, IContext>);

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
