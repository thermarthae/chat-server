import mongoose = require('mongoose');
import DataLoader = require('dataloader');
import { ApolloError, toApolloError } from 'apollo-server-core';

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
		.cache(30)
		.catch(err => {
			if (err.name === 'CastError') throw new ApolloError('404 (Not Found)', 'NotFound');
			throw toApolloError(err);
		}) as IUser[];

	if (!result[0]) throw new ApolloError('404 (Not Found)', 'NotFound');
	return result;
};

export const convIDFn = async (ids: Array<{}>) => {
	const result = await ConversationModel.aggregate([
		{ $match: { _id: { $in: ids.map(id => mongoose.Types.ObjectId(id as any)) } } },
		{ $lookup: { from: 'User', localField: 'users', foreignField: '_id', as: 'users' } },
	]).cache(30);

	if (!result[0]) throw new ApolloError('404 (Not Found)', 'NotFound');
	return result;
};
