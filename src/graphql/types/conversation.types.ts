import {
	GraphQLObjectType,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
	GraphQLList,
} from 'graphql';

const seenType = new GraphQLObjectType({
	name: 'Seen',
	fields: () => ({
		user: {
			type: new GraphQLNonNull(GraphQLString)
		},
		time: {
			type: new GraphQLNonNull(GraphQLString)
		},
	})
});


export const messageType = new GraphQLObjectType({
	name: 'Message',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		author: {
			type: new GraphQLNonNull(GraphQLString)
		},
		time: {
			type: new GraphQLNonNull(GraphQLString)
		},
		seen: {
			type: new GraphQLList(seenType)
		},
		content: {
			type: GraphQLString
		},
	})
});

const draftType = new GraphQLObjectType({
	name: 'Draft',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		time: {
			type: new GraphQLNonNull(GraphQLString)
		},
		content: {
			type: GraphQLString
		},
	})
});

export const conversationType = new GraphQLObjectType({
	name: 'Conversation',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID)
		},
		name: {
			type: GraphQLString
		},
		users: {
			type: new GraphQLList(GraphQLString)
		},
		draft: {
			type: new GraphQLList(draftType)
		},
		messages: {
			type: new GraphQLList(messageType)
		},

	})
});
