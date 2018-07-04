import express = require('express');
import cors = require('cors');
import cookieParser = require('cookie-parser');
import { graphqlExpress } from 'apollo-server-express';
import expressPlayground from 'graphql-playground-middleware-express';
import bodyParser = require('body-parser');
import morgan = require('morgan');
import mongoose = require('mongoose');
import http = require('http');
import cachegoose = require('cachegoose');
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';

import dataLoaders, { IDataLoaders } from './dataloaders';
import { parseToken } from './utils/token.utils';
import schema from './graphql';
import { IUserToken } from './graphql/types/user.types';

interface ISecretKeys {
	primary: string;
	secondary: string;
}

export interface IRootValue {}
export interface IContext extends IDataLoaders {
	res: express.Response;
	verifiedToken: IUserToken | undefined;
}
console.clear();
cachegoose(mongoose, {
	// engine: 'redis',
	port: 6379,
	host: 'localhost'
});

mongoose.connect(process.env.MONGO_ATLAS_URI as string)
	.then(() => console.log('Connected to DB. '))
	.catch(err => { throw err; });
mongoose.set('debug', true);

const port = process.env.PORT || 3000;
const adress = 'localhost';
const url = `${adress}:${port}`;
const app = express();

export const secretKeys: ISecretKeys = {
	primary: '461b2697-e354-4b45-9500-cb4b410ca993',
	secondary: '1f8bbfcb-3505-42b7-9f57-e7563eff8f25'
};

app.use(cors({
	origin: `http://${adress}:8080`,
	credentials: true
}));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(
	'/graphql',
	bodyParser.json(),
	graphqlExpress(async (req, res) => {
		const verifiedToken = await parseToken(req!, res!);

		return {
			schema,
			tracing: true,
			context: {
				res,
				...dataLoaders,
				verifiedToken,
			}
		};
	})
);

app.use(
	'/playground',
	expressPlayground({
		endpoint: '/graphql',
		subscriptionEndpoint: `ws://${url}/graphql`,
	})
);

const server = http.createServer(app);

server.listen(port, () => {
	console.log(
		'\x1b[36m%s\x1b[0m',
		`GraphQL Server is now running on http://${url}/graphql`
	);
	console.log(
		'\x1b[35m%s\x1b[0m',
		`GraphQL Playground is now running on http://${url}/playground`
	);

	new SubscriptionServer(// TODO Auth cookie
		{
			execute,
			subscribe,
			schema,
			onConnect: (x: any) => {
				console.log('TESTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT', x);
				// if (x.Authorization) return { verifiedToken: verifyToken(x.Authorization, secretKeys.primary) }; //Context
				throw new Error('Missing auth token!');
			}
		},
		{
			server,
			path: '/graphql'
		});
});
