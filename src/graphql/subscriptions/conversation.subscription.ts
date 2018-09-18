import { GraphQLFieldConfig } from 'graphql';
import { pubsub } from '../';
import { withFilter } from 'graphql-subscriptions';

import { IContext } from '../../';
import { messageType } from '../types/message.types';

import { checkIfNoTokenOwnerErr } from '../../utils/access.utils';

export const newMessageAdded: GraphQLFieldConfig<any, IContext, any> = {
	type: messageType,
	description: 'Get new added message',
	subscribe: withFilter(
		() => pubsub.asyncIterator('newMessageAdded'),
		({ authorizedUsers }, { }, { tokenOwner }: IContext) => {
			const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
			return !!authorizedUsers.find((id: string) => verifiedUser._id.equals(id));
		}
	),
	resolve: async payload => payload.message
};
