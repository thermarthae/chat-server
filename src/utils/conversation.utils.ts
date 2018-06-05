import { IDataLoaders } from '../';

export const conversationAuthorisation = async (loaders: IDataLoaders, userId: string, conversationId: string ) => {
	const conversation = await loaders.conversationLoader.load(conversationId);
	if (conversation.users.includes(userId)) return;
	throw new Error('Permission error');
};
