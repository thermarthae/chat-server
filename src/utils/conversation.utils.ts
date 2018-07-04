import { TConvLoader } from '../dataloaders';

export const conversationAuthorisation = async (convIDLoader: TConvLoader, userId: string, conversationId: string ) => {
	const conversation = await convIDLoader.load(conversationId);
	if (conversation.users.includes(userId)) return;
	throw new Error('Permission error');
};
