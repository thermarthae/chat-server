import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
	GraphQLList
} from 'graphql';
import mongoose = require('mongoose');
import { UserInputError } from 'apollo-server-core';

import ConversationModel, { IConversation } from '../../models/conversation';
import MessageModel from '../../models/message';
import { pubsub } from '../';
import { conversationType } from '../types/conversation.types';
import { messageType } from '../types/message.types';
import { checkIfUsersExist, checkUserRightsToConv, checkIfNoSessionOwnerErr } from '../../utils/access.utils';
import { IRootValue, IContext } from '../../server';

interface IInitConversationArgs {
	userIdArr: string[];
	message: string;
	name: null | string;
}
export const initConversation: GraphQLFieldConfig<IRootValue, IContext, IInitConversationArgs> = {
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
			defaultValue: null,
		}
	},
	resolve: async ({ }, { userIdArr, message, name }, { userIDLoader, convIDLoader, sessionOwner }) => {
		if (!message || message.length < 1) throw new UserInputError('Message could not be empty');
		if (userIdArr.length === 0) throw new UserInputError('userIdArr must contain at least 1 user id');
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		const parsedUserIds = [...new Set(userIdArr).add(String(verifiedUser._id))];
		await checkIfUsersExist(parsedUserIds, userIDLoader);

		const time = new Date();
		const seen = [];
		const draft = [];
		for (const user of parsedUserIds) {
			seen.push({
				user,
				time: verifiedUser._id.equals(user) ? time : new Date(0)
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
			name,
			users: parsedUserIds,
			messages: [newMessage],
			seen,
			draft,
			significantlyUpdatedAt: time,
		});

		await Promise.all([newMessage.save(), newConversation.save()]);
		return await convIDLoader.load(newConversation._id);
	}
};

interface ISendMessageArgs {
	conversationId: string;
	message: string;
}
export const sendMessage: GraphQLFieldConfig<IRootValue, IContext, ISendMessageArgs> = {
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
	resolve: async ({ }, { conversationId, message }, { sessionOwner, convIDLoader }) => {
		if (!message || message.length < 1) throw new UserInputError('Message could not be empty');
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		const conversation = await checkUserRightsToConv(conversationId, verifiedUser, convIDLoader);
		const time = new Date();
		const newMessage = new MessageModel({
			author: verifiedUser._id,
			conversation: conversationId,
			time,
			content: message,
		});

		const [{ users }] = await Promise.all([
			ConversationModel.findByIdAndUpdate(
				conversationId,
				{
					$push: { messages: newMessage._id },
					$set: {
						'significantlyUpdatedAt': time,
						'draft.$[d].content': '',
						'seen.$[s].time': time,
					}
				},
				{
					new: true,
					arrayFilters: [{ 's.user': verifiedUser._id }, { 'd.user': verifiedUser._id }]
				} as any
			) as any as IConversation,
			newMessage.save()
		]);

		const parsedMessage = Object.assign({},
			newMessage.toObject(),
			{
				me: true,
				author: {
					_id: verifiedUser._id,
					name: verifiedUser.name,
					email: verifiedUser.email,
				}
			}
		);
		pubsub.publish('newMessageAdded', { conversation, authorizedUsers: users, message: parsedMessage });
		return parsedMessage;
	}
};

export const markConversationAsRead: GraphQLFieldConfig<IRootValue, IContext, { conversationId: string }> = {
	type: GraphQLString,
	description: 'Mark given conversation as read',
	args: {
		conversationId: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation Id'
		},
	},
	resolve: async ({ }, { conversationId }, { sessionOwner, convIDLoader }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		await checkUserRightsToConv(conversationId, verifiedUser, convIDLoader);
		const status = await ConversationModel.updateOne(
			{ _id: conversationId },
			{ $set: { 'seen.$[s].time': new Date() } },
			{ arrayFilters: [{ 's.user': verifiedUser._id }] }
		);
		return status.ok === 1 ? 'Success!' : null;
	}
};
