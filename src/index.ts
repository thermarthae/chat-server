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
import jwt = require('jsonwebtoken');
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import DataLoader = require('dataloader');

import UserModel, { IUser } from './models/user';
import ConversationModel, { IConversation } from './models/conversation';
import { verifyToken, renewTokens, setTokenCookies } from './utils/token.utils';
import schema from './graphql';
import { IUserToken } from './graphql/types/user.types';

interface ISecretKeys {
	primary: string;
	secondary: string;
}
export interface IDataLoaders {
	userLoader: DataLoader<string, IUser>;
	conversationLoader: DataLoader<string, IConversation>;
}

export interface IRootValue {}
export interface IContext {
	res: express.Response;
	loaders: IDataLoaders;
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
}
));
app.use(cookieParser());

const parseToken = async (req: express.Request, res: express.Response, loaders: IDataLoaders) => {
	const token = req.headers['x-token'] as string;
	if (!token) return;

	const cookieToken = req.cookies.token;
	if (!cookieToken || token !== cookieToken) return;

	try {
		await verifyToken(loaders, token, secretKeys.primary);
		return jwt.decode(token) as IUserToken;
	} catch (err) {
		const refreshToken = req.headers['x-refresh-token'] as string;
		if (!refreshToken) return;

		const cookieRefreshToken = req.cookies['refresh-token'];
		if (!cookieRefreshToken || refreshToken !== cookieRefreshToken) return;

		const newTokens = await renewTokens(loaders, refreshToken);
		console.log('NEWTOKENS', newTokens);

		res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
		res.set('x-token', newTokens.access_token);
		res.set('x-refresh-token', newTokens.refresh_token);
		setTokenCookies(res, newTokens);

		console.log('NEWTOKENS.ACCESS_TOKEN', newTokens.access_token);
		return jwt.decode(newTokens.access_token) as IUserToken;
	}
};

app.use(morgan('dev'));
app.use(
	'/graphql',
	bodyParser.json(),
	graphqlExpress(async (req, res) => {
		const loaders = {
			userLoader: new DataLoader(async ids => {
				return await UserModel.find({ _id: { $in: ids } }).cache(10).catch(err => {
					throw err;
				}) as IUser[];
			}),
			conversationLoader: new DataLoader(async ids => {
				return await ConversationModel.find({ _id: { $in: ids } }).cache(10).catch(err => {
					throw err;
				}) as IConversation[];
			}),
		};
		const verifiedToken = await parseToken(req!, res!, loaders);

		return {
			schema,
			tracing: true,
			context: {
				res,
				loaders,
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
