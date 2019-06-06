import glob = require('glob');
import path = require('path');
import { GraphQLObjectType, GraphQLSchema } from 'graphql';

const getFiles = (filePath: string) => glob.sync(filePath)
	.map(resolver => require(resolver) as object)
	.reduce((all, current) => Object.assign(all, current));
const pathToModules = path.join(__dirname);
const extPattern = '+(ts|js)';

const queries = getFiles(`${pathToModules}/*/query/*.${extPattern}`);
const mutations = getFiles(`${pathToModules}/*/mutation/*.${extPattern}`);
const subscriptions = getFiles(`${pathToModules}/*/subscription/*.${extPattern}`);

export default new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		fields: { ...queries }
	}),
	mutation: new GraphQLObjectType({
		name: 'Mutation',
		fields: { ...mutations }
	}),
	subscription: new GraphQLObjectType({
		name: 'Subscription',
		fields: { ...subscriptions }
	})
});
