import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
	GraphQLBoolean,
} from 'graphql';
import { GraphQLDateTime } from 'graphql-iso-date';
import { IMessage } from '../../models/message';
import { userType } from './user.types';
import { IContext } from '../..';

export const messageType = new GraphQLObjectType({
	name: 'Message',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID),
			resolve: ({ _id }) => String(_id)
		},
		author: {
			type: new GraphQLNonNull(userType)
		},
		conversation: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: ({ conversation }) => String(conversation)
		},
		time: {
			type: new GraphQLNonNull(GraphQLDateTime),
			description: 'String in simplified extended ISO format (ISO 8601)'
		},
		content: {
			type: GraphQLString
		},
		me: {
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: ({ author }, { }, { sessionOwner }) => sessionOwner!._id.equals(author._id) ? true : false
		},
	})
} as GraphQLObjectTypeConfig<IMessage, IContext>);
