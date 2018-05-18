import DataLoader = require('dataloader');
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
import UserModel, { IUser } from '../../models/user';
import { userInConversationType } from './user.types';

const userLoader = new DataLoader(async users => {
	return await UserModel.find({ _id: { $in: users } }).cache(30).catch(err => {
		throw err;
	}) as IUser[];
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
			resolve: async ({ name, users }: IConversation) => {
				const usersFromDB = await userLoader.loadMany(users);
				const names = usersFromDB.map(user => user.name);
				return names.join(', ');
			}
		},
		users: {
			type: new GraphQLNonNull(new GraphQLList(userInConversationType)),
			resolve: async ({ users }: IConversation) => await userLoader.loadMany(users)
		},
		seen: {
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: (result: IConversation, { }, { verifiedToken }) => {
				const seen = result.seen.find(r => r.user == verifiedToken._id); // tslint:disable-line:triple-equals
				const messageArr = result.messages.reverse();
				const unreaded = messageArr.find(msg => msg.time > seen!.time);
				if (unreaded) return false;
				return true;
			}
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
