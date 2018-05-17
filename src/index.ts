import express = require('express');
import cors = require('cors');
import { graphqlExpress } from 'apollo-server-express';
import expressPlayground from 'graphql-playground-middleware-express';
import bodyParser = require('body-parser');
import morgan = require('morgan');
import mongoose = require('mongoose');
import http = require('http');
import cachegoose = require('cachegoose');
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import TokenUtils from './utils/token.utils';
import schema from './graphql';
import { IUserToken } from './graphql/types/user.types';

export interface IRootValue {
	access_token?: string;
	secretKey: {
		primary: string;
		secondary: string;
	};
}

export interface IContext {
	verifiedToken: IUserToken;
}

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
const secretKey = {
	primary: '461b2697-e354-4b45-9500-cb4b410ca993',
	secondary: '1f8bbfcb-3505-42b7-9f57-e7563eff8f25'
};

app.use('*', cors({ origin: [`http://${url}`, `http://${adress}:8080`] }));
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'POST, GET');
	res.header(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization, X-Apollo-Tracing, Credentials'//Accept, Origin, X-Requested-With
	);
	res.header('Access-Control-Allow-Credentials', 'true');
	if (req.method === 'OPTIONS') return res.status(200).json({});
	next();
});

app.use(morgan('dev'));
app.use(
	'/graphql',
	bodyParser.json(),
	graphqlExpress(req => {
		const authToken = req!.headers.authorization;
		const rootValue = {
			access_token: authToken,
			secretKey
		};
		const verifiedToken = TokenUtils.verifyAccessToken(rootValue);

		return {
			schema,
			rootValue,
			tracing: true,
			context: {
				verifiedToken,
			}
		};
	})
);

app.use(
	'/playground',
	expressPlayground({
		endpoint: '/graphql',
		subscriptionsEndpoint: `ws://${url}/graphql`
	})
);

//////////////////////////////////////////////////////////////////////////////

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

	new SubscriptionServer(
		{
			execute,
			subscribe,
			schema,
			onConnect: ({ Authorization }: any) => {
				if (Authorization) {
					const source = { access_token: Authorization, secretKey };
					return { verifiedToken: TokenUtils.verifyAccessToken(source) }; //Context
				}
				throw new Error('Missing auth token!');
			}
		},
		{
			server,
			path: '/graphql'
		});
});
