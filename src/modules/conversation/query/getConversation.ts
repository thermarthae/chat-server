import { GraphQLID, GraphQLNonNull, GraphQLFieldConfig } from 'graphql';
import { IRootValue, IContext } from '../../../server';
import ConversationType from '../ConversationType';
import { checkIfNoSessionOwnerErr, checkUserRightsToConv } from '../../../utils/access.utils';

export const getConversation: GraphQLFieldConfig<IRootValue, IContext, { id: string }> = {
	type: new GraphQLNonNull(ConversationType),
	description: 'Get conversation by ID',
	args: {
		id: {
			type: new GraphQLNonNull(GraphQLID),
			description: 'Conversation ID'
		}
	},
	resolve: async ({ }, { id }, { sessionOwner, convIDLoader }) => {
		const verifiedUser = checkIfNoSessionOwnerErr(sessionOwner);
		return await checkUserRightsToConv(id, verifiedUser, convIDLoader);
	}
};
