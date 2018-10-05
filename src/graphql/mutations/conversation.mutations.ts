import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
	GraphQLList
} from 'graphql';
import mongoose = require('mongoose');

import ConversationModel, { IConversation } from '../../models/conversation';
import MessageModel from '../../models/message';
import { pubsub } from '../';
import { conversationType } from '../types/conversation.types';
import { messageType } from '../types/message.types';
import { checkIfUsersExist, checkUserRightsToConv, checkIfNoTokenOwnerErr } from '../../utils/access.utils';
import { IRootValue, IContext } from '../../';

export const initConversation: GraphQLFieldConfig<IRootValue, IContext> = {
	type: conversationType,
	description: 'Send message to initialize conversation with given users',
	args: {
		userIdArr: {
			type: new GraphQLNonNull(new GraphQLList(GraphQLID)),
			description: 'Array of users ID you wanna chat'
		},
		message: {
			type: new GraphQLNonNull(GraphQLString),
			description: 'Your message'
		},
		name: {
			type: GraphQLString,
			description: 'Name of the conversation',
			defaultValue: null
		}
	},
	resolve: async ({ }, { userIdArr, message, name }, { userIDLoader, convIDLoader, tokenOwner }) => {
		if (!message) throw new Error('Empty message');
		const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
		const parsedUserIds = [...new Set(userIdArr as string).add(String(verifiedUser._id))];
		await checkIfUsersExist(parsedUserIds, userIDLoader);

		const time = Date.now().toString();
		const seen = [];
		const draft = [];
		for (const user of parsedUserIds as string[]) {
			seen.push({
				user,
				time: verifiedUser._id.equals(user) ? 0 : time
			});
			draft.push({ user, content: '' });
		}

		const newConversationID = new mongoose.mongo.ObjectId();
		const newMessage = new MessageModel({
			author: verifiedUser._id,
			conversation: newConversationID,
			time,
			content: message,
		});
		const newConversation = new ConversationModel({
			_id: newConversationID,
			name, //TODO: not null
			users: parsedUserIds,
			messages: [newMessage],
			seen,
			draft
		});

		await newMessage.save();
		await newConversation.save();
		return await convIDLoader.load(newConversation._id);
	}
};

export const sendMessage: GraphQLFieldConfig<IRootValue, IContext> = { //TODO: prevent empty msg
	type: messageType,
	description: 'Send message in given conversation',
	args: {
		conversationId: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation Id'
		},
		message: {
			type: new GraphQLNonNull(GraphQLString),
			description: 'Your message'
		}
	},
	resolve: async ({ }, { conversationId, message }, { tokenOwner, convIDLoader }) => {
		if (!message) throw new Error('Empty message');
		const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
		const conversation = await checkUserRightsToConv(conversationId, verifiedUser, convIDLoader);
		const time = Date.now().toString();
		const newMessage = new MessageModel({
			author: verifiedUser._id,
			conversation: conversationId,
			time,
			content: message,
		});
		const { users } = await ConversationModel.findByIdAndUpdate(
			conversationId,
			{ $push: { messages: newMessage._id } }
		) as IConversation;

		await ConversationModel.update(
			{ 'seen.user': verifiedUser._id },
			{ $set: { 'seen.$.time': time } }
		);

		await ConversationModel.update(
			{ 'draft.user': verifiedUser._id },
			{ $set: { 'draft.$.content': '' } }
		);

		await newMessage.save();

		const parsedMessage = Object.assign({},
			newMessage.toObject(),
			{
				me: true,
				author: {
					_id: verifiedUser._id,
					name: verifiedUser.name,
					email: verifiedUser.email,
					isAdmin: verifiedUser.isAdmin
				}
			}
		);
		pubsub.publish('newMessageAdded', { conversation, authorizedUsers: users, message: parsedMessage });
		return parsedMessage;
	}
};
