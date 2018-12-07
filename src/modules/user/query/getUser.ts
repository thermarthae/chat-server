import { GraphQLID, GraphQLNonNull, GraphQLFieldConfig } from 'graphql';
import UserType from '../UserType';
import { IRootValue, IContext } from '../../../server';
import { checkIfNoSessionOwnerErr, checkUserRightsToId } from '../../../utils/access.utils';

export const getUser: GraphQLFieldConfig<IRootValue, IContext, { id: string }> = {
	type: UserType,
	description: 'Get user by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'User ID'
		}
	},
	resolve: async ({ }, { id }, { sessionOwner, userIDLoader }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		checkUserRightsToId(id, verifiedUser);
		return await userIDLoader.load(id);
	}
};
