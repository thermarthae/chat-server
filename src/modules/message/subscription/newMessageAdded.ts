import { GraphQLFieldConfig } from 'graphql';
import pubSub from '../../../pubSub';
import { withFilter } from 'graphql-subscriptions';

import { ISubContext } from '../../../server';
import MessageType from '../MessageType';

import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';

export const newMessageAdded: GraphQLFieldConfig<any, ISubContext> = {
	type: MessageType,
	description: 'Get new added message',
	subscribe: withFilter(
		() => pubSub.asyncIterator('newMessageAdded'),
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
