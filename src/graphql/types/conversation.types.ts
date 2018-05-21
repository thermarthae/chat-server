import {
	GraphQLObjectType,
	GraphQLNonNull,
	GraphQLString,
	GraphQLInt,
	GraphQLID,
	GraphQLList,
	GraphQLBoolean,
} from 'graphql';
import { IConversation } from '../../models/conversation';
import { userLoader } from '../../models/user';
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

export const conversationType = new GraphQLObjectType({
	name: 'Conversation',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		name: {
			type: GraphQLString,
			resolve: async ({ name, users }: IConversation, { }, { verifiedToken }: IContext) => {
				const usersWithoutCurrent = users.filter(user => user !== verifiedToken._id);
				const usersFromDB = await userLoader.loadMany(usersWithoutCurrent);
				const names = usersFromDB.map(user => user.name);
				return names.join(', ');
			}
		},
		users: {
			type: new GraphQLNonNull(new GraphQLList(userInConversationType)),
			resolve: async ({ users }: IConversation, { }, { verifiedToken }: IContext) => {
				const usersWithoutCurrent = users.filter(user => user !== verifiedToken._id);
				return await userLoader.loadMany(usersWithoutCurrent);
			}
		},
		seen: {
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: (result: IConversation, { }, { verifiedToken }: IContext) => {
				const seen = result.seen.find(r => r.user == verifiedToken._id);
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
			resolve: ({ draft }: IConversation, { }, { verifiedToken }: IContext) => {
				return draft.find(userDraft => userDraft._id == verifiedToken._id);
			}
		},
		messages: {
			type: new GraphQLNonNull(new GraphQLList(messageType)),
			resolve: async ({ messages }: IConversation, { }, { verifiedToken }: IContext) => {
				return await messages.map(async message => {
					let me = false;
					if (message.author == verifiedToken._id) me = true;
					const author = await userLoader.load(message.author);
					return {
						...(message as any)._doc,
						me,
						authorName: author.name,
					};
				});
			}
		},
		lastMessage: {
			type: new GraphQLNonNull(messageType),
			resolve: async ({ messages }: IConversation, { }, { verifiedToken }: IContext) => {
				const lastMessage = messages[messages.length - 1];
				let me = false;
				if (lastMessage.author == verifiedToken._id) me = true;
				const author = await userLoader.load(lastMessage.author);
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
			resolve: (result: IConversation, { }, { verifiedToken }: IContext) => {
				const seen = result.seen.find(r => r.user == verifiedToken._id);
				const messageArr = result.messages.reverse();
				return messageArr.findIndex(msg => msg.time < seen!.time);
			}
		},
	})
});
