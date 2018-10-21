// TODO: new apollo errors throw
// TODO: split updateUser into smaller 'updates' + clear cache after
// TODO: add mark as seen

import express = require('express');
import session = require('express-session');
import connectMongo = require('connect-mongo');
const MongoStore = connectMongo(session);
import cookieParser = require('cookie-parser');
import { ApolloServer } from 'apollo-server-express';
import morgan = require('morgan');
import mongoose = require('mongoose');
import http = require('http');
import cachegoose = require('cachegoose');
import DataLoader = require('dataloader');

import initPassport from './passport';
import { mongodbURI, secretKeys } from '../SECRETS';
import schema from './graphql';
import { IDataLoaders, userIDFn, convIDFn } from './dataloaders';
import { IUser } from './models/user';

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

mongoose.connect(mongodbURI, { useNewUrlParser: true }).then(() => console.log('Connected to DB. '));
mongoose.set('debug', true);

const port = process.env.PORT || 3000;
const adress = 'localhost';
const url = `${adress}:${port}`;
const app = express();
app.use(cookieParser());
app.use(morgan('dev'));
app.use(session({
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		touchAfter: 12 * 3600 // 12h
	}),
	name: 'chatid',
	secret: 'SECRET', //TODO
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		secure: false, //TODO
		sameSite: true,
		maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
	}
}));
initPassport(app);

const server = new ApolloServer({
	schema,
	tracing: true,
	context: async ({ req, res, connection }: any) => {
		if (connection) return connection.context;
		return {
			res,
			userIDLoader: new DataLoader(async ids => userIDFn(ids)),
			convIDLoader: new DataLoader(async ids => convIDFn(ids)),
			tokenOwner: await parseToken(req, res),
		} as IContext;
	},
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
	},
	playground: {
		settings: {
			'request.credentials': 'include',
			'editor.cursorShape': 'line'
		} as any
	},
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
