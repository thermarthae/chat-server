import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from 'graphql';

import UserModel from '../UserModel';
import UserType from '../UserType';
import { checkIfNoSessionOwnerErr, checkUserRightsToId } from '../../../utils/access.utils';
import { IRootValue, IContext } from '../../../server';

export const deleteUserAccount: GraphQLFieldConfig<IRootValue, IContext, { id: string }> = {
	type: UserType,
	description: 'Delete user account',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'User ID'
		}
	},
	resolve: async ({ }, { id }, { sessionOwner }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		checkUserRightsToId(id, verifiedUser);
		return await UserModel.findByIdAndRemove(id);
	}
};
