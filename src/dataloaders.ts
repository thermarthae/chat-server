import DataLoader = require('dataloader');

import UserModel, { IUser } from './models/user';
import ConversationModel, { IConversation } from './models/conversation';

export type TUserLoader = DataLoader<string, IUser>;
export type TConvLoader = DataLoader<string, IConversation>;

export interface IDataLoaders {
	userIDLoader: TUserLoader;
	convIDLoader: TConvLoader;
}

export const userIDFn = async (ids: Array<{}>) => {
	const result = await UserModel.find({ _id: { $in: ids } })
		.cache(10)
		.catch(err => {
			if (err.name === 'CastError') throw new Error('404 (Not Found)');
			throw err;
		}) as IUser[];
		
	if (!result[0]) throw new Error('404 (Not Found)');
	return result;
};
export const convIDFn = async (ids: Array<{}>) => {
	const result = await ConversationModel.find({ _id: { $in: ids } })
		.cache(10)
		.catch(err => {
			if (err.name === 'CastError') throw new Error('404 (Not Found)');
			throw err;
		}) as IConversation[];

	if (!result[0]) throw new Error('404 (Not Found)');
	return result;
};
