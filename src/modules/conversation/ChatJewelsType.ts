import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLInt
} from 'graphql';
import { IContext } from '../../server';

const chatJewels = new GraphQLObjectType({
	name: 'ChatJewels',
	description: 'Count of draft, unread and all user conversation',
	fields: () => ({
		conversationCount: {
			type: new GraphQLNonNull(GraphQLInt),
			description: 'Count of all conversation that user belongs to'
		},
		draftCount: {
			type: new GraphQLNonNull(GraphQLInt),
			description: 'Count of all conversation that contain unsended messages'
		},
		unreadCount: {
			type: new GraphQLNonNull(GraphQLInt),
			description: 'Count of all unseen conversations'
		}
	})
} as GraphQLObjectTypeConfig<any, IContext>);
export default chatJewels;
