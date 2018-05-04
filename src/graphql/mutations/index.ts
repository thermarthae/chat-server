import userMutation = require('./user.mutations');
import postMutation = require('./post.mutations');
import conversationMutation = require('./conversation.mutations');

import { GraphQLFieldConfigMap } from 'graphql';

export default {
	...userMutation,
	...postMutation,
	...conversationMutation
} as GraphQLFieldConfigMap<any, any>;
