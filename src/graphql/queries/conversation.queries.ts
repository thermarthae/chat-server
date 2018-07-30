import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLFieldConfig
} from 'graphql';

import { IRootValue, IContext } from '../../';
import { conversationType } from '../types/conversation.types';
import { checkIfNoTokenOwnerErr, checkUserRightsToConv } from '../../utils/access.utils';

export const getConversation: GraphQLFieldConfig<IRootValue, IContext> = {
	type: conversationType,
	description: 'Get conversation by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation ID'
		}
	},
	resolve: async ({}, { id }, { tokenOwner, convIDLoader }) => {
		const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
		return await checkUserRightsToConv(id, verifiedUser, convIDLoader);
	}
};
