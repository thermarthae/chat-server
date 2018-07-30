import { TUserLoader, TConvLoader } from '../dataloaders';
import { IUser } from '../models/user';

export const checkUserRightsToConv = async (conversationId: string, verifiedUser: IUser, convIDLoader: TConvLoader) => {
	const conversation = await convIDLoader.load(conversationId);
	const userInConv = conversation.users.find(usr => usr._id == verifiedUser._id);
	if (!userInConv || !verifiedUser.isAdmin) throw new Error('Authorisation error');
	return conversation;
};

export const checkIfUsersExist = async (userIdArr: string[], userIDLoader: TUserLoader) => {
	return await userIDLoader.loadMany(userIdArr).catch(() => { throw new Error('Users not exist'); });
};

export const checkIfNoTokenOwnerErr = (tokenOwner: IUser | undefined) => {
	if (!tokenOwner || !tokenOwner._id) throw new Error('Access token error');
	return tokenOwner;
};

export const checkUserRightsToId = (idToCheck: string, verifiedUser: IUser) => {
	if (verifiedUser._id == idToCheck) return;
	throw new Error('Permission error');
};

