import {
	GraphQLID,
	GraphQLNonNull,
	GraphQLFieldConfig,
	GraphQLEnumType
} from 'graphql';

import { IRootValue, IContext } from '../../';
import { conversationType, userConversationsType } from '../types/conversation.types';
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

export const userConversations: GraphQLFieldConfig<IRootValue, IContext> = {
	type: userConversationsType,
	description: 'Get current user conversations',
	args: {
		filter: {
			defaultValue: 'all',
			type: new GraphQLEnumType({
				name: 'conversationFilter',
				values: {
					ALL: { value: 'all' },
					UNREAD: { value: 'unread' },
					DRAFT: { value: 'draft' },
				}
			}),
		},
	},
	resolve: async ({ }, { filter }, { tokenOwner, convUsersLoader }) => {
		const verifiedUser = checkIfNoTokenOwnerErr(tokenOwner);
		const result = await convUsersLoader.load(verifiedUser._id);
		const draftArr = [];
		const unreadArr = [];

		for (const conversation of result) {
			const lastMessage = conversation.messages[conversation.messages.length - 1];
			const seen = conversation.seen.find(r => String(r.user) == String(verifiedUser._id));
			const userDraft = conversation.draft.find(d => String(d.user) == String(verifiedUser._id));

			if (userDraft && userDraft.content) draftArr.push(conversation);
			if (!seen || lastMessage.time > seen.time) unreadArr.push(conversation);
		}

		const conversationArr = (filter === 'unread') ? unreadArr : ((filter === 'draft') ? draftArr : result);
		return {
			conversationArr,
			conversationCount: result.length,
			draftCount: draftArr.length,
			unreadCount: unreadArr.length,
		};
	}
};
