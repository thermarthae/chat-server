import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
	GraphQLList
} from 'graphql';
import * as crypto from 'crypto';

import ConversationModel, { IConversation } from '../../models/conversation';
import { pubsub } from '../';
import { conversationType, messageType } from '../types/conversation.types';
import TokenUtils from '../../utils/token.utils';
import ConversationUtils from '../../utils/conversation.utils';

export const initConversation: GraphQLFieldConfig<any, any, any> = {
	type: conversationType,
	description: 'Send message to initialize conversation with given users',
	args: {
		idArr: {
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
	resolve: async (source, { idArr, message, name }) => {
		const user = TokenUtils.verifyAccessToken(source);

		const newConversation = new ConversationModel({
			name,
			users: idArr,
			messages: [{
				_id: crypto.randomBytes(16).toString('hex'),
				author: user._id,
				time: Date.now().toString(),
				seen: [{
					user: user._id,
					time: '-1'
				}],
				content: message,
			}]
		});

		return await newConversation.save().catch(err => {
			// throw new Error('Initialize conversation error');
			throw err;
		});
	}
};

export const sendMessage: GraphQLFieldConfig<any, any, any> = {
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
	resolve: async (source, { conversationId, message }) => {
		const user = TokenUtils.verifyAccessToken(source);
		await ConversationUtils.checkPermission(source, user._id, conversationId);

		const messageAdded = {
			_id: crypto.randomBytes(16).toString('hex'),
			author: user._id,
			time: Date.now().toString(),
			seen: [{
				user: user._id,
				time: '-1'
			}],
			content: message,
		};

		const { users }: IConversation = await ConversationModel.findByIdAndUpdate(
			conversationId,
			{ $push: { messages: messageAdded } },
			{ select: 'users -_id' }
		).catch(err => {
			throw new Error('Error');
		});

		pubsub.publish('messageAdded', { messageAdded, conversationId, authorizedUsers: users });

		return messageAdded;
	}
};
