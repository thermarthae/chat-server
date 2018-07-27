import { TUserLoader, TConvLoader } from '../dataloaders';
import { IUserToken } from '../graphql/types/user.types';


export const checkConvAuth = async (convIDLoader: TConvLoader, userId: string, conversationId: string) => {
	const conversation = await convIDLoader.load(conversationId);
	const user = conversation.users.filter(usr => usr._id == userId);
	if (user.length > 0) return user[0];
	throw new Error('Authorisation error');
};

export const checkConvPerm = async (token: IUserToken, userIDLoader: TUserLoader, userIdArr: string[]) => {
	try {
		if (!userIdArr.includes(token.sub)) throw ''; //tslint:disable-line
		return await userIDLoader.loadMany(userIdArr);
	} catch (err) { throw new Error('Authorisation error'); }
};
