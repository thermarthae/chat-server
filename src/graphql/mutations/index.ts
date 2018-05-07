import userMutation = require('./user.mutations');
import conversationMutation = require('./conversation.mutations');

import { GraphQLFieldConfigMap } from 'graphql';

export default {
	...userMutation,
	...conversationMutation
} as GraphQLFieldConfigMap<any, any>;
