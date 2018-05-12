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
		const userFromToken = TokenUtils.verifyAccessToken(source);
		const result: any = await ConversationModel.findById(id).cache(10).catch(err => {
			throw new Error('Conversation getting error');
		});

		return Object.assign({userFromToken}, result._doc);
	}
};
