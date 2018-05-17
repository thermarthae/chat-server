import {
	GraphQLObjectType,
	GraphQLNonNull,
	GraphQLString,
	GraphQLInt,
	GraphQLID,
	GraphQLList,
	GraphQLBoolean,
} from 'graphql';

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

import { IConversation } from '../../models/conversation';

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
		lastMessage: {
			type: messageType,
			resolve: (result: IConversation) =>  result.messages[result.messages.length - 1]
		},
		messagesCount: {
			type: new GraphQLNonNull(GraphQLInt),
			resolve: (result: IConversation) => result.messages.length
		},
		unread: {//TODO Unread Count
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: (result: IConversation, {}, { verifiedToken }) => {
				const lastMessage = result.messages[result.messages.length - 1];
				const seen = result.seen.find(r => r.user == verifiedToken._id); // tslint:disable-line:triple-equals
				if (lastMessage.time > seen!.time) return true;
				return false;
			}
		},
	})
});
