import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
	GraphQLList
} from 'graphql';

import ConversationModel, { IConversation } from '../../models/conversation';
import MessageModel from '../../models/message';
import { pubsub } from '../';
import { conversationType, messageType } from '../types/conversation.types';
import { checkIfTokenError } from '../../utils/token.utils';
import { checkConvAuth, checkConvPerm } from '../../utils/conversation.utils';
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
	resolve: async ({ }, { userIdArr, message, name }, { userIDLoader, convIDLoader, verifiedToken }) => {
		checkIfTokenError(verifiedToken);
		await checkConvPerm(verifiedToken!, userIDLoader, userIdArr);
		const time = Date.now().toString();
		const seen = [];
		const draft = [];
		for (const user of userIdArr as string[]) {
			seen.push({
				user,
				time: user != verifiedToken!.sub ? 0 : time
			});
			draft.push({ user, content: '' });
		}

		const newMessage = new MessageModel({
			author: verifiedToken!.sub,
			time,
			content: message,
		});
		const newConversation = new ConversationModel({
			name,
			users: userIdArr,
			messages: [newMessage],
			seen,
			draft
		});

		await newMessage.save();
		await newConversation.save();
		return await convIDLoader.load(newConversation._id);
	}
};

export const sendMessage: GraphQLFieldConfig<IRootValue, IContext> = {
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
	resolve: async ({ }, { conversationId, message }, { verifiedToken, convIDLoader }) => {
		checkIfTokenError(verifiedToken);
		const authUser = await checkConvAuth(convIDLoader, verifiedToken!.sub, conversationId);
		const time = Date.now().toString();
		const newMessage = new MessageModel({
			author: authUser._id,
			time,
			content: message,
		});
		const { users } = await ConversationModel.findByIdAndUpdate(
			conversationId, { $push: { messages: newMessage._id } }
		).catch(err => { throw err; }) as IConversation;

		await ConversationModel.update(
			{ 'seen.user': authUser._id }, { $set: { 'seen.$.time': time } }
		).catch(err => { throw err; });

		await ConversationModel.update(
			{ 'draft.user': authUser._id }, { $set: { 'draft.$.content': '' } }
		).catch(err => { throw err; });

		await newMessage.save().catch(err => { throw err; });

		const parsedMessage = Object.assign(
			newMessage.toObject(),
			{
				me: true,
				author: {
					_id: authUser._id,
					name: authUser.name,
					email: authUser.email,
					isAdmin: authUser.isAdmin
				}
			}
		);
		pubsub.publish('messageAdded', { conversationId, authorizedUsers: users, message: parsedMessage });
		return parsedMessage;
	}
};
