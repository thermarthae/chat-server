import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLFieldConfig
} from 'graphql';

import { IRootValue, IContext } from '../../';
import { conversationType } from '../types/conversation.types';
import ConversationModel from '../../models/conversation';
import TokenUtils from '../../utils/token.utils';

export const getConversation: GraphQLFieldConfig<IRootValue, IContext> = {
	type: conversationType,
	description: 'Get conversation by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation ID'
		}
	},
	resolve: async ({}, { id }, { verifiedToken }) => {
		TokenUtils.checkIfAccessTokenIsVerified(verifiedToken);

		return await ConversationModel.findById(id).cache(10).catch(err => {
			throw new Error('Conversation getting error');
		});
	}
};
