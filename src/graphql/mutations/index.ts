import userMutation = require("./user.mutations");
import postMutation = require("./post.mutations");
import { GraphQLFieldConfigMap } from "graphql";

export default {
	...userMutation,
	...postMutation
} as GraphQLFieldConfigMap<any, any>;
