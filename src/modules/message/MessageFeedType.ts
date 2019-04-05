import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLID,
	GraphQLBoolean,
	GraphQLList,
} from 'graphql';
import { IMessage } from './MessageModel';
import messageType from './MessageType';
import { IContext } from '../../server';


export interface IMessageFeed {
	node?: IMessage[];
	noMore?: boolean | null;
}

const messageFeedType = new GraphQLObjectType({
	name: 'MessageFeed',
	fields: () => ({
		cursor: {
			type: GraphQLID,
			resolve: ({ node }) => {
				if (!node || !node[0] || !node[0]._id) return null;
				return String(node[0]._id);
			}
		},
		noMore: {
			type: GraphQLBoolean,
			resolve: ({ noMore = null }) => typeof noMore === 'boolean' ? noMore : null
		},
		node: {
			type: new GraphQLNonNull(new GraphQLList(messageType)),
			resolve: ({ node }) => node || []
		},
	})
} as GraphQLObjectTypeConfig<IMessageFeed, IContext>);

export default messageFeedType;
