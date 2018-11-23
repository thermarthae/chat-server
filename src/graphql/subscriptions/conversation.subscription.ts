import { GraphQLFieldConfig } from 'graphql';
import { pubsub } from '../';
import { withFilter } from 'graphql-subscriptions';

import { ISubContext } from '../../server';
import { messageType } from '../types/message.types';
import { conversationType } from '../types/conversation.types';

import { checkIfNoSessionOwnerErr } from '../../utils/access.utils';

export const newMessageAdded: GraphQLFieldConfig<any, ISubContext> = {
	type: messageType,
	description: 'Get new added message',
	subscribe: withFilter(
		() => pubsub.asyncIterator('newMessageAdded'),
		({ authorizedUsers }, { }, { sessionOwner }) => {
			const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
			return !!authorizedUsers.find((id: string) => verifiedUser._id.equals(id));
		}
	),
	resolve: async ({ message }, { }, { sessionOwner }) => {
		return Object.assign(message, {
			me: sessionOwner!._id.equals(message.author) ? true : false
		});
	}
};

export const updatedConversation: GraphQLFieldConfig<any, ISubContext> = {
	type: conversationType,
	subscribe: withFilter(
		() => pubsub.asyncIterator('newMessageAdded'),
		({ authorizedUsers }, { }, { sessionOwner }) => {
			const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
			return !!authorizedUsers.find((id: string) => verifiedUser._id.equals(id));
		}
	),
	resolve: async ({ message, conversation }, { }, { sessionOwner }) => {
		const messages = [Object.assign(message, {
			me: sessionOwner!._id.equals(message.author) ? true : false
		})];
		const updatedConv = Object.assign({}, conversation, { messages });
		return updatedConv;
	}
};
