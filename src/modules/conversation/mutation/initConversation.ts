import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
	GraphQLList
} from 'graphql';
import mongoose = require('mongoose');
import { UserInputError } from 'apollo-server-core';

import MessageModel from '../../message/MessageModel';
import ConversationModel from '../ConversationModel';
import ConversationType from '../ConversationType';
import { checkIfUsersExist, checkIfNoSessionOwnerErr } from '../../../utils/access.utils';
import { checkIfConvExist } from '../../..//utils/conversation.utils';
import pubSub from '../../../pubSub';
import { IRootValue, IContext } from '../../../server';

interface IInitConversationArgs {
	userIdArr: string[];
	message: string;
	name: null | string;
}
export const initConversation: GraphQLFieldConfig<IRootValue, IContext, IInitConversationArgs> = {
	type: new GraphQLNonNull(ConversationType),
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

		// Concurrently validate data
		await Promise.all([
			checkIfUsersExist(parsedUserIds, userIDLoader),
			checkIfConvExist(parsedUserIds)
		])

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
		const populatedConv = await convIDLoader.load(newConversation._id);

		pubSub.publish('updatedConversation', {
			authorizedIds: parsedUserIds,
			conversation: populatedConv
		});

		return populatedConv;
	}
};
