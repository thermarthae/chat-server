import DataLoader = require('dataloader');

import UserModel, { IUser } from './models/user';
import ConversationModel, { IConversation } from './models/conversation';

type TUserLoader = DataLoader<string, IUser>;
export type TConvLoader = DataLoader<string, IConversation>;
type TConvLoaderArr = DataLoader<string, [IConversation]>;

export interface IDataLoaders {
	userIDLoader: TUserLoader;
	convIDLoader: TConvLoader;
	convUsersLoader: TConvLoaderArr;
}

export const userIDFn = async (ids: Array<{}>) => {
	return await UserModel.find({ _id: { $in: ids } }).cache(10).catch(err => {
		if (err.name === 'CastError') throw new Error('404 (Not Found)');
		throw err;
	}) as IUser[];
};
export const convIDFn = async (ids: Array<{}>) => {
	return await ConversationModel.find({ _id: { $in: ids } }).cache(10).catch(err => {
		if (err.name === 'CastError') throw new Error('404 (Not Found)');
		throw err;
	}) as IConversation[];
};
export const convUsersFn = async (ids: Array<{}>) => {
	const result = await ConversationModel.find({ users: { $all: ids } }).cache(10).catch(err => {
		if (err.name === 'CastError') throw new Error('404 (Not Found)');
		throw err;
	}) as IConversation[];
	return [[...result]];
};
