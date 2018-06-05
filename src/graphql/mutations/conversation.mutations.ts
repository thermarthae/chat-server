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
import { checkIfTokenError } from '../../utils/token.utils';
import { conversationAuthorisation } from '../../utils/conversation.utils';
import { IRootValue, IContext } from '../../';

export const initConversation: GraphQLFieldConfig<IRootValue, IContext> = {
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
	resolve: async ({}, { idArr, message, name }, { verifiedToken }) => {
		checkIfTokenError(verifiedToken);

		const time = Date.now().toString();
		const newConversation = new ConversationModel({
			name,
			users: idArr,
			messages: [{
				_id: crypto.randomBytes(16).toString('hex'),
				author: verifiedToken!._id,
				time,
				content: message,
			}],
			seen: [{
				user: verifiedToken!._id,
				time
			}]
		});

		return await newConversation.save().catch(err => {
			// throw new Error('Initialize conversation error');
			throw err;
		});
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
	resolve: async ({}, { conversationId, message }, { verifiedToken, loaders }) => {
		checkIfTokenError(verifiedToken);
		await conversationAuthorisation(loaders, verifiedToken!._id, conversationId);

		const messageAdded = {
			_id: crypto.randomBytes(16).toString('hex'),
			author: verifiedToken!._id,
			time: Date.now().toString(),
			content: message,
		};

		const seen = {
			user: verifiedToken!._id,
			time: Date.now().toString()
		};

		const { users }: IConversation = await ConversationModel.findByIdAndUpdate(
			conversationId,
			{ $push: {messages: messageAdded, seen} },
			{ select: 'users -_id' }
		).catch(err => {
			throw err;
		});

		pubsub.publish('messageAdded', { messageAdded, conversationId, authorizedUsers: users });

		return messageAdded;
	}
};
