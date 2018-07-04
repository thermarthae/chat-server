import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLString,
	GraphQLInt,
	GraphQLID,
	GraphQLList,
	GraphQLBoolean,
} from 'graphql';
import { IConversation } from '../../models/conversation';
import { userInConversationType } from './user.types';
import { IContext } from '../../';

export const messageType = new GraphQLObjectType({
	name: 'Message',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		author: {
			type: new GraphQLNonNull(GraphQLString)
		},
		authorName: {
			type: new GraphQLNonNull(GraphQLString)
		},
		time: {
			type: new GraphQLNonNull(GraphQLString)
		},
		me: {
			type: new GraphQLNonNull(GraphQLBoolean)
		},
		content: {
			type: GraphQLString
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
			resolve: async ({ users }: IConversation, { }, { verifiedToken, userIDLoader }) => {
				const usersWithoutCurrent = users.filter(user => user !== verifiedToken!.sub);
				const usersFromDB = await userIDLoader.loadMany(usersWithoutCurrent);
				const names = usersFromDB.map(user => user.name);
				return names.join(', ');
			}
		},
		users: {
			type: new GraphQLNonNull(new GraphQLList(userInConversationType)),
			resolve: async ({ users }: IConversation, { }, { verifiedToken, userIDLoader }) => {
				const usersWithoutCurrent = users.filter(user => user !== verifiedToken!.sub);
				return await userIDLoader.loadMany(usersWithoutCurrent);
			}
		},
		seen: {
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: (result: IConversation, { }, { verifiedToken }) => {
				const seen = result.seen.find(r => r.user == verifiedToken!.sub);
				if (!seen) return false;
				const messageArr = result.messages.reverse();
				const unreaded = messageArr.find(msg => msg.time > seen!.time);
				if (unreaded) return false;
				return true;
			}
		},
		draft: {
			type: new GraphQLObjectType({
				name: 'Draft',
				fields: () => ({
					time: {
						type: new GraphQLNonNull(GraphQLString)
					},
					content: {
						type: GraphQLString
					},
				})
			}),
			resolve: ({ draft }: IConversation, { }, { verifiedToken }) => {
				return draft.find(userDraft => userDraft._id == verifiedToken!.sub);
			}
		},
		messages: {
			type: new GraphQLNonNull(new GraphQLList(messageType)),
			resolve: async ({ messages }: IConversation, { }, { verifiedToken, userIDLoader }) => {
				const messagesFromDB = [];
				for (const message of messages) {
					let me = false;
					if (message.author == verifiedToken!.sub) me = true;
					const author = await userIDLoader.load(message.author);
					messagesFromDB.push({
						...(message as any)._doc,
						me,
						authorName: author.name,
					});
				}
				return messagesFromDB;
			}
		},
		lastMessage: {
			type: new GraphQLNonNull(messageType),
			resolve: async ({ messages }: IConversation, { }, { verifiedToken, userIDLoader }) => {
				const lastMessage = messages[messages.length - 1];
				let me = false;
				if (lastMessage.author == verifiedToken!.sub) me = true;
				const author = await userIDLoader.load(lastMessage.author);
				return {
					...(lastMessage as any)._doc,
					me,
					authorName: author.name,
				};
			}
		},
		messagesCount: {
			type: new GraphQLNonNull(GraphQLInt),
			resolve: (result: IConversation) => result.messages.length
		},
		unreadCount: {
			type: new GraphQLNonNull(GraphQLInt),
			resolve: (result: IConversation, { }, { verifiedToken }) => {
				const seen = result.seen.find(r => r.user == verifiedToken!.sub);
				const messageArr = result.messages.reverse();
				return messageArr.findIndex(msg => msg.time < seen!.time);
			}
		},
	})
} as GraphQLObjectTypeConfig<any, IContext>);
