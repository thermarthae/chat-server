import ConversationModel, { IConversation } from '../models/conversation';

export default class ConversationUtils {
	public static async checkPermission(userId: string, conversationId: string) {
		const conversation = await ConversationModel.findById(conversationId, 'users').cache(5).catch(err => {
			throw err;
		});

		if ((conversation as IConversation).users.includes(userId)) return;
		throw new Error('Permission error');
	}
}
