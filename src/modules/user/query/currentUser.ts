import { GraphQLFieldConfig } from 'graphql';
import UserType from '../UserType';
import { IRootValue, IContext } from '../../../server';
import { checkIfNoSessionOwnerErr } from '../../../utils/access.utils';

export const currentUser: GraphQLFieldConfig<IRootValue, IContext> = {
	type: UserType,
	description: 'Get current user data',
	resolve: ({ }, { }, { sessionOwner }) => checkIfNoSessionOwnerErr(sessionOwner)
};
