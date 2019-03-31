import { GraphQLFieldConfig, GraphQLNonNull } from 'graphql';
import pubSub from '../../../pubSub';
import { withFilter } from 'graphql-subscriptions';

import { ISubContext } from '../../../server';
import ConversationType from '../ConversationType';
import { IConversation } from '../ConversationModel';

import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';

interface IUpdatedConversation {
	authorizedIds: string[];
	conversation: IConversation;
}

export const updatedConversation: GraphQLFieldConfig<IUpdatedConversation, ISubContext> = {
	type: new GraphQLNonNull(ConversationType),
	subscribe: withFilter(
		() => pubSub.asyncIterator('updatedConversation'),
		({ authorizedIds }: IUpdatedConversation, { }, { sessionOwner }: ISubContext) => {
			try {
				const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
				return !!authorizedIds.find((id: string) => verifiedUser._id.equals(id));
			} catch (err) {
				console.log('catch:', err);
				return false;
			}
		}
	),
	resolve: async ({ conversation }, { }, { sessionOwner }) => {
		const messages = conversation.messages!.map(
			msg => Object.assign(msg, {
				me: sessionOwner!._id.equals(msg.author) ? true : false
			})
		);

		const updatedConv = Object.assign({}, conversation, { messages });
		return updatedConv;
	}
};
