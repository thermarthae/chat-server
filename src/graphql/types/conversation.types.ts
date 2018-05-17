import {
	GraphQLObjectType,
	GraphQLNonNull,
	GraphQLString,
	GraphQLInt,
	GraphQLID,
	GraphQLList,
} from 'graphql';
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
		seen: {
			type: new GraphQLList(new GraphQLObjectType({
				name: 'Seen',
				fields: () => ({
					user: {
						type: new GraphQLNonNull(GraphQLString)
					},
					time: {
						type: new GraphQLNonNull(GraphQLString)
					},
				})
			}))
		},
		draft: {
			type: new GraphQLList(new GraphQLObjectType({
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
			}))
		},
		messages: {
			type: new GraphQLNonNull(new GraphQLList(messageType))
		},
		lastMessage: {
			type: messageType,
			resolve: (result: IConversation) => result.messages[result.messages.length - 1]
		},
		messagesCount: {
			type: new GraphQLNonNull(GraphQLInt),
			resolve: (result: IConversation) => result.messages.length
		},
		unreadCount: {
			type: new GraphQLNonNull(GraphQLInt),
			resolve: (result: IConversation, { }, { verifiedToken }) => {
				const seen = result.seen.find(r => r.user == verifiedToken._id); // tslint:disable-line:triple-equals
				const messageArr = result.messages.reverse();
				return messageArr.findIndex(msg => msg.time < seen!.time);

			}
		},
	})
});
