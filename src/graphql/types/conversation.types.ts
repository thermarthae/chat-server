import {
	GraphQLObjectType,
	GraphQLNonNull,
	GraphQLString,
	GraphQLInt,
	GraphQLID,
	GraphQLList,
} from 'graphql';
import { IConversationAndTokenResult } from '../../models/conversation';
// import TokenUtils from '../../utils/token.utils';

const seenType = new GraphQLObjectType({
	name: 'Seen',
	fields: () => ({
		user: {
			type: new GraphQLNonNull(GraphQLString)
		},
		time: {
			type: new GraphQLNonNull(GraphQLString)
		},
	})
});


export const messageType = new GraphQLObjectType({
	name: 'Message',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		author: {
			type: new GraphQLNonNull(GraphQLString)
		},
		time: {
			type: new GraphQLNonNull(GraphQLString)
		},
		seen: {
			type: new GraphQLList(seenType)
		},
		content: {
			type: GraphQLString
		},
	})
});

const draftType = new GraphQLObjectType({
	name: 'Draft',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		time: {
			type: new GraphQLNonNull(GraphQLString)
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
			type: GraphQLString
		},
		users: {
			type: new GraphQLNonNull(new GraphQLList(GraphQLString))
		},
		draft: {
			type: new GraphQLList(draftType)
		},
		messages: {
			type: new GraphQLNonNull(new GraphQLList(messageType))
		},
		messagesCount: {
			type: new GraphQLNonNull(GraphQLInt),
			resolve: (result: IConversationAndTokenResult) => result.messages.length
		},
		unread: {
			type: new GraphQLObjectType({
				name: 'Unread',
				fields: () => ({
					count: {
						type: new GraphQLNonNull(GraphQLID)
					},
					allMessages: {
						type: new GraphQLList(messageType)
					},
					lastMessage: {
						type: messageType
					},
				})
			}),
			resolve: (result: IConversationAndTokenResult) => {
				const allMessages = result.messages.filter(
					message => message.seen.find(seen => seen.user !== result.userFromToken._id)
				);
				return {
					count: allMessages.length,
					allMessages,
					lastMessage: allMessages[allMessages.length - 1]
				};
			}
		},
	})
});
