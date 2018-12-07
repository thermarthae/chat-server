import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLList,
	GraphQLInt
} from 'graphql';
import { IContext } from '../../server';
import ConversationType from './ConversationType';

const userConversationsType = new GraphQLObjectType({
	name: 'userConversations',
	description: 'Data of conversation that user belongs to',
	fields: () => ({
		conversationArr: {
			type: new GraphQLList(ConversationType),
			description: 'Conversation that user belongs to'
		},
		conversationCount: {
			type: new GraphQLNonNull(GraphQLInt),
			description: 'Count of all conversation that user belongs to'
		},
		draftCount: {
			type: new GraphQLNonNull(GraphQLInt)
		},
		unreadCount: {
			type: new GraphQLNonNull(GraphQLInt)
		}
	})
} as GraphQLObjectTypeConfig<any, IContext>);
export default userConversationsType;
