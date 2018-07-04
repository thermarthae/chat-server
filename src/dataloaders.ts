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

export default {
	userIDLoader: new DataLoader(async ids => {
		return await UserModel.find({ _id: { $in: ids } }).cache(10).catch(err => {
			throw err;
		}) as IUser[];
	}),
	convIDLoader: new DataLoader(async ids => {
		return await ConversationModel.find({ _id: { $in: ids } }).cache(10).catch(err => {
			throw err;
		}) as IConversation[];
	}),
	convUsersLoader: new DataLoader(async ids => {
		const result = await ConversationModel.find({ users: { $all: ids } }).cache(10).catch(err => {
			throw err;
		}) as IConversation[];
		return [[...result]];
	}),
};
