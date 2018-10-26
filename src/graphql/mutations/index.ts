import userMutation = require('./user.mutations');
import conversationMutation = require('./conversation.mutations');

export default {
	...userMutation,
	...conversationMutation
};
