import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
	GraphQLList,
	GraphQLBoolean,
} from 'graphql';
import { IConversation } from '../../models/conversation';
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

export const conversationType = new GraphQLObjectType({ //TODO Pagination
	name: 'Conversation',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		name: {
			type: GraphQLString,
			resolve: ({ name, users }: IConversation, { }, { tokenOwner }) => {

				if (name) return name;
				const usersWithoutCurrent = users.filter(user => user._id != tokenOwner!._id);
				const usersName = usersWithoutCurrent.map(user => user.name);
				return usersName.join(', ');
			}
		},
		users: {
			type: new GraphQLNonNull(new GraphQLList(userType)),
			resolve: ({ users }: IConversation, { }, { tokenOwner }) => {
				const usersWithoutCurrent = users.filter(user => user._id != tokenOwner!._id);
				return usersWithoutCurrent;
			}
		},
		seen: {
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: ({ seen, messages }: IConversation, { }, { tokenOwner }) => {
				const seenByUser = seen.find(s => s.user == tokenOwner!._id);
				if (!seenByUser) return false;
				const messageArr = messages.slice(0).reverse(); // duplicate arr then reverse
				const unreaded = messageArr.find(msg => msg.time > seenByUser.time);
				if (unreaded) return false;
				return true;
			}
		},
		draft: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: ({ draft }: IConversation, { }, { tokenOwner }) => {
				const userDraft = draft.find(draftObj => draftObj.user == tokenOwner!._id);
				if (!userDraft) return '';
				return userDraft.content;
			}
		},
		messages: {
			type: new GraphQLNonNull(new GraphQLList(messageType)),
			resolve: async ({ messages }: IConversation, { }, { tokenOwner }) => {
				const messagesFromDB = [];
				for (const message of messages) {
					let me = false;
					if (message.author == tokenOwner!._id) me = true;
					messagesFromDB.push({
						...message,
						me,
						author: message.author,
					});
				}
				return messagesFromDB;
			}
		},
		lastMessage: {
			type: new GraphQLNonNull(messageType),
			resolve: async ({ messages }: IConversation, { }, { tokenOwner }) => {
				const lastMessage = messages[messages.length - 1];
				let me = false;
				if (lastMessage.author == tokenOwner!._id) me = true;
				return Object.assign(lastMessage, { me, author: lastMessage.author });
			}
		}
	})
} as GraphQLObjectTypeConfig<any, IContext>);
