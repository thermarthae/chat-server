import { GraphQLFieldConfig, GraphQLNonNull } from 'graphql';
import pubSub from '../../../pubSub';
import { withFilter } from 'graphql-subscriptions';

import { ISubContext } from '../../../server';
import ConversationType from '../ConversationType';

import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';

export const updatedConversation: GraphQLFieldConfig<any, ISubContext> = {
	type: new GraphQLNonNull(ConversationType),
	subscribe: withFilter(
		() => pubSub.asyncIterator('newMessageAdded'),
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
