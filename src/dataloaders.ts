import mongoose = require('mongoose');
import DataLoader = require('dataloader');
import { ApolloError, toApolloError, ForbiddenError } from 'apollo-server-core';

import UserModel, { IUser, UserErrors } from './models/user';
import ConversationModel, { IConversation } from './models/conversation';

export type TUserLoader = DataLoader<string, IUser>;
export type TConvLoader = DataLoader<string, IConversation>;

export interface IDataLoaders {
	userIDLoader: TUserLoader;
	convIDLoader: TConvLoader;
}

export const userIDFn = async (ids: Array<{}>) => {
	const error = new ApolloError(
		UserErrors.UserNotExistsError,
		'UserNotExistsError',
	);

	const result = await UserModel.find({ _id: { $in: ids } })
		.cache(30)
		.catch(err => {
			if (err.name === 'CastError') throw error;
			throw toApolloError(err);
		}) as IUser[];

	if (!result[0]) throw error;
	return result;
};

export const convIDFn = async (ids: Array<{}>) => {
	const result = await ConversationModel.aggregate([
		{ $match: { _id: { $in: ids.map(id => mongoose.Types.ObjectId(id as any)) } } },
		{ $lookup: { from: 'User', localField: 'users', foreignField: '_id', as: 'users' } },
	]).cache(30);

	if (!result[0]) new ForbiddenError('Conversation does not exist or access denied');
	return result;
};

////////////////////////////////////

const createDataloaders = () => ({
	userIDLoader: new DataLoader(async ids => userIDFn(ids)),
	convIDLoader: new DataLoader(async ids => convIDFn(ids)),
});

export default createDataloaders;
