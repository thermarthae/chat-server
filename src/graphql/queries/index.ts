import user = require('./user.queries');
import conversation = require('./conversation.queries');

export default {
	...user,
	...conversation
};
