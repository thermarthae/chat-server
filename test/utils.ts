import { IUser } from '../src/models/user';
import createDataloaders from '../src/dataloaders';

export const fakeCtx = (arg: {
	sessionOwner?: IUser | undefined,
	req?: any,
	res?: any
} = {}) => ({
	req: {},
	res: {},
	sessionOwner: undefined,
	...createDataloaders(),
	...arg,
});
