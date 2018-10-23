// TODO: new apollo errors throw
// TODO: split updateUser into smaller 'updates' + clear cache after
// TODO: add mark as seen

import dotenv = require('dotenv');
dotenv.config();
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
import schema from './graphql';
import { IDataLoaders, userIDFn, convIDFn } from './dataloaders';
import { IUser } from './models/user';
import { ConnectionContext } from 'subscriptions-transport-ws';

export interface IRootValue { }
export interface IContext extends IDataLoaders {
	req: express.Request;
	tokenOwner: IUser | undefined;
}

const isDev = process.env.NODE_ENV !== 'production';
if (isDev) console.log('\x1b[31m%s\x1b[0m', 'DEVELOPMENT MODE');

cachegoose(mongoose, {
	engine: isDev ? 'memory' : 'redis',
	port: process.env.REDIS_PORT,
	host: process.env.REDIS_ADDRESS
});

mongoose.connect(process.env.MONGODB_URI!, { useNewUrlParser: true }).then(() => console.log('Connected to DB. '));
if (isDev) mongoose.set('debug', true);

const app = express();
app.use(cookieParser());
app.use(morgan('dev'));
app.use(session({
	store: new MongoStore({
		mongooseConnection: mongoose.connection,
		touchAfter: 12 * 3600 // 12h
	}),
	name: 'chatid',
	secret: process.env.SESSION_SECRET!,
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		secure: !isDev,
		sameSite: true,
		maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
	}
}));
initPassport(app);

const server = new ApolloServer({
	debug: isDev,
	schema,
	tracing: true,
	context: async ({ req, connection }: any) => {
		if (connection) return connection.context;
		return {
			req,
			userIDLoader: new DataLoader(async ids => userIDFn(ids)),
			convIDLoader: new DataLoader(async ids => convIDFn(ids)),
			tokenOwner: req.user, //TODO: rename to loggedUser
		} as IContext;
	},
	subscriptions: {
		onConnect: async ({ }, { }, context: ConnectionContext) => {
			try {
				//TODO: Get session cookie, find in db, then return user from db

				const cookies = context.request.headers.cookie;
				if (!cookies) throw new Error('Missing auth cookie!');

				// const refreshCookie = cookies.match(RegExp('refresh_token=([^;]*)'))[0].split('=')[1];
				// const signCookie = cookies.match(RegExp('sign_token=([^;]*)'))[0].split('=')[1];
				// const tokenOwner = await verifyToken(refreshCookie + signCookie, secretKeys.secondary);
				// return { tokenOwner };
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
		origin: process.env.CORS_ORGIN,
		credentials: true
	}
});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(process.env.SERVER_PORT as any, process.env.SERVER_ADDRESS, () => {
	const { address, port } = httpServer.address() as any;
	const url = address + ':' + port;
	console.log(
		'\x1b[36m%s\x1b[0m',
		`GraphQL Server is now running on http://${url + server.graphqlPath}`
	);
	console.log(
		'\x1b[35m%s\x1b[0m',
		`GraphQL WS is now running on ws://${url + server.subscriptionsPath}`
	);
});
