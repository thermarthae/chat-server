import ConversationModel, { IConversation } from '../models/conversation';
import { IRootValue } from '../';

export default class ConversationUtils {
	public static async checkPermission(source: IRootValue, userId: string, conversationId: string) {
		const conversation = await ConversationModel.findById(conversationId, 'users').cache(5).catch(err => {
			throw err;
		});

		if ((conversation as IConversation).users.includes(userId)) return;
		throw new Error('Permission error');
	}
}
