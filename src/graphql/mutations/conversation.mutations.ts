import {
	GraphQLFieldConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLString,
	GraphQLList
} from 'graphql';
import * as crypto from 'crypto';

import ConversationModel from '../../models/conversation';
import { pubsub } from '../';
import { conversationType, messageType } from '../types/conversation.types';
import { checkToken } from '../../utils/token.utils';

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
		checkToken(source);
		const fakeAuthorID = '5ab7eb53c226e213206f07ec'; //TODO From Token

		const newConversation = new ConversationModel({
			name,
			users: idArr,
			messages: [{
				_id: crypto.randomBytes(16).toString('hex'),
				author: fakeAuthorID,
				time: Date.now().toString(),
				seen: [{
					user: fakeAuthorID,
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
		// const conversation = await ConversationModel.findById(conversationId).catch(err => {
		// 	throw new Error('Error getting conversation from DB');
		// });
		//checkPermissions(conversation.id, source);
		const fakeAuthorID = '5ab7eb53c226e213206f07ec'; //TODO From Token
		const newMessage = {
			_id: crypto.randomBytes(16).toString('hex'),
			author: fakeAuthorID,
			time: Date.now().toString(),
			seen: [{
				user: fakeAuthorID,
				time: '-1'
			}],
			content: message,
		};

		await ConversationModel.findByIdAndUpdate(
			conversationId,
			{
				$push: {
					messages: newMessage
				}
			},
			{ new: true }
		).catch(err => {
			throw new Error('Error');
		});

		pubsub.publish('messageAdded', { messageAdded: newMessage, conversationId: '5ae62ff43b9c5b0f04795bad' });

		return newMessage;
	}
};

// export const updateUser: GraphQLFieldConfig<any, any, any> = {
// 	type: userType,
// 	description: 'Update user data',
// 	args: {
// 		id: {
// 			type: new GraphQLNonNull(GraphQLID),
// 			description: 'User ID'
// 		},
// 		payload: {
// 			type: new GraphQLNonNull(userInputType),
// 			description: 'user updated data'
// 		}
// 	},
// 	resolve: async (source, { id, payload }) => {
// 		checkPermissions(id, source);
//
// 		return await UserModel.findByIdAndUpdate(
// 			id,
// 			{ $set: { ...payload } },
// 			{ new: true }
// 		).catch(err => {
// 			throw new Error('Error updating user');
// 		});
// 	}
// };
