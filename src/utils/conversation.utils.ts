import { conversationLoader, IConversation } from '../models/conversation';

export default class ConversationUtils {
	public static async checkPermission(userId: string, conversationId: string) {
		const conversation = await conversationLoader.load(conversationId);

		if ((conversation as IConversation).users.includes(userId)) return;
		throw new Error('Permission error');
	}
}
