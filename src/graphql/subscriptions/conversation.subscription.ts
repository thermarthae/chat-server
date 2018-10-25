import { GraphQLFieldConfig } from 'graphql';
import { pubsub } from '../';
import { withFilter } from 'graphql-subscriptions';

import { ISubContext } from '../../';
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
	resolve: async payload => payload.message
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
	resolve: async payload => {
		const updatedConv = Object.assign({},
			payload.conversation,
			{ messages: [payload.message] }
		);
		return updatedConv;
	}
};
