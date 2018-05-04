import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { PubSub } from "graphql-subscriptions";

import queries from "./queries";
import mutations from "./mutations";
import subscriptions from "./subscriptions";

export const pubsub = new PubSub();

export default new GraphQLSchema({
	query: new GraphQLObjectType({
		name: "Query",
		fields: {
			...queries
		}
	}),
	mutation: new GraphQLObjectType({
		name: "Mutation",
		fields: {
			...mutations
		}
	}),
	subscription: new GraphQLObjectType({
		name: "Subscription",
		fields: {
			...subscriptions
		}
	})
});
