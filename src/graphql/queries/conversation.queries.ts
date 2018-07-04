import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLFieldConfig
} from 'graphql';

import { IRootValue, IContext } from '../../';
import { conversationType } from '../types/conversation.types';
import { checkIfTokenError } from '../../utils/token.utils';

export const getConversation: GraphQLFieldConfig<IRootValue, IContext> = {
	type: conversationType,
	description: 'Get conversation by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation ID'
		}
	},
	resolve: async ({}, { id }, { verifiedToken, convIDLoader }) => {
		checkIfTokenError(verifiedToken);
		return await convIDLoader.load(id);
	}
};
