import { TUserLoader, TConvLoader } from '../dataloaders';
import UserModel, { IUser, UserErrors } from '../models/user';
import { ForbiddenError, ApolloError } from 'apollo-server-core';
import { Store } from 'express-session';

export const checkUserRightsToConv = async (conversationId: string, verifiedUser: IUser, convIDLoader: TConvLoader) => {
	try {
		const conversation = await convIDLoader.load(conversationId);
		const userInConv = conversation.users!.find(usr => verifiedUser._id.equals(usr._id));
		if (!userInConv) throw {};
		return conversation;
	} catch (error) {
		throw new ForbiddenError('Conversation does not exist or access denied');
	}
};

export const checkIfUsersExist = async (userIdArr: string[], userIDLoader: TUserLoader) => {
	return await userIDLoader.loadMany(userIdArr).catch(() => {
		throw new ApolloError(
			UserErrors.UserNotExistsError,
			'UserNotExistsError',
		);
	});
};

export const checkIfNoSessionOwnerErr = (sessionOwner: IUser | undefined) => {
	if (!sessionOwner || !sessionOwner._id) throw new ApolloError(
		UserErrors.AlreadyLoggedOut,
		'AlreadyLoggedOut',
	);
	return sessionOwner;
};

export const checkUserRightsToId = (idToCheck: string, verifiedUser: IUser) => {
	if (verifiedUser._id.equals(idToCheck)) return;
	throw new ForbiddenError('Access denied');
};

/////////////////////////////////////////////////

export const getUsernameFromSession = (sid: string, store: Store) => new Promise((resolve, reject) =>
	store.get(sid, (err, sess) => {
		if (err || !sess || !sess.passport) return reject(err);
		const { user } = sess!.passport;
		if (!user) reject(err);
		resolve(user);
	})
) as Promise<string>;

export const deserializeUser = (username: string) => new Promise((resolve, reject) =>
	UserModel.deserializeUser()(username, (err, res) => {
		if (err || !res) return reject(err);
		resolve(res);
	})
) as Promise<IUser>;
