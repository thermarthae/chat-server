import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLFieldConfig
} from 'graphql';

import { IRootValue } from '../../';
import { conversationType } from '../types/conversation.types';
import ConversationModel from '../../models/conversation';
import TokenUtils from '../../utils/token.utils';

export const getConversation: GraphQLFieldConfig<IRootValue, any, any> = {
	type: conversationType,
	description: 'Get conversation by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation ID'
		}
	},
	resolve: async (source, { id }) => {
		TokenUtils.verifyAccessToken(source);
		return await ConversationModel.findById(id).catch(err => {
			throw new Error('Error getting user');
		});
	}
};
