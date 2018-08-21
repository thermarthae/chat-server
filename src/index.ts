// TODO: new apollo errors throw

import express = require('express');
import cookieParser = require('cookie-parser');
import { ApolloServer } from 'apollo-server-express';
import morgan = require('morgan');
import mongoose = require('mongoose');
import http = require('http');
import cachegoose = require('cachegoose');
import DataLoader = require('dataloader');

import { parseToken, verifyToken } from './utils/token.utils';
import schema from './graphql';
import { IDataLoaders, userIDFn, convIDFn } from './dataloaders';
import { IUser } from './models/user';

interface ISecretKeys {
	primary: string;
	secondary: string;
}

export interface IRootValue { }
export interface IContext extends IDataLoaders {
	res: express.Response;
	tokenOwner: IUser | undefined;
}
console.clear();
cachegoose(mongoose, {
	// engine: 'redis',
	port: 6379,
	host: 'localhost'
});

mongoose.connect(process.env.MONGO_ATLAS_URI as string, { useNewUrlParser: true })
	.then(() => console.log('Connected to DB. '));
mongoose.set('debug', true);

const port = process.env.PORT || 3000;
const adress = 'localhost';
const url = `${adress}:${port}`;
const app = express();

export const secretKeys: ISecretKeys = {
	primary: '461b2697-e354-4b45-9500-cb4b410ca993',
	secondary: '1f8bbfcb-3505-42b7-9f57-e7563eff8f25'
};

app.use(cookieParser());
app.use(morgan('dev'));

const server = new ApolloServer({
	schema,
	tracing: true,
	context: async ({ req, res }: any) => ({
		res,
		userIDLoader: new DataLoader(async ids => userIDFn(ids)),
		convIDLoader: new DataLoader(async ids => convIDFn(ids)),
		tokenOwner: await parseToken(req, res),
	} as IContext),
	subscriptions: {
		onConnect: async ({ }, { }, context: any) => {
			try {
				const cookies = context.request.headers.cookie;
				if (!cookies) throw new Error('Missing auth cookie!');
				const refreshCookie = cookies.match(RegExp('refresh_token=([^;]*)'))[0].split('=')[1];
				const signCookie = cookies.match(RegExp('sign_token=([^;]*)'))[0].split('=')[1];
				const tokenOwner = await verifyToken(refreshCookie + signCookie, secretKeys.secondary);
				return { tokenOwner };
			} catch (err) { } // tslint:disable-line
		}
	}
});

server.applyMiddleware({
	app,
	cors: {
		origin: `http://${adress}:8080`,
		credentials: true
	}
});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(port, () => {
	console.log(
		'\x1b[36m%s\x1b[0m',
		`GraphQL Server is now running on http://${url + server.graphqlPath}`
	);
	console.log(
		'\x1b[35m%s\x1b[0m',
		`GraphQL WS is now running on ws://${url + server.subscriptionsPath}`
	);
});
