import { TUserLoader, TConvLoader } from '../dataloaders';
import { IUser, UserErrors } from '../modules/user/UserModel';
import { ForbiddenError, ApolloError } from 'apollo-server-core';

export const checkUserRightsToId = (idToCheck: string, verifiedUser: IUser) => {
	if (
		verifiedUser.role === 'ADMIN'
		|| verifiedUser._id.equals(idToCheck)
	) return;
	throw new ForbiddenError(UserErrors.RightsForbidden);
};

export const checkUserRightsToConv = async (conversationId: string, verifiedUser: IUser, convIDLoader: TConvLoader) => {
	try {
		const conversation = await convIDLoader.load(conversationId);
		if (verifiedUser.role === 'ADMIN') return conversation;
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
	if (!sessionOwner || !sessionOwner._id) throw new ForbiddenError(UserErrors.NotLoggedInForbidden);
	return sessionOwner;
};
