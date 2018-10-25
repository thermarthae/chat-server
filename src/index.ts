// TODO: new apollo errors throw
// TODO: split updateUser into smaller 'updates' + clear cache after
// TODO: add mark as seen

import dotenv = require('dotenv');
dotenv.config();
import express = require('express');
import session = require('express-session');
import connectMongo = require('connect-mongo');
import cookie = require('cookie');
import cookieParser = require('cookie-parser');
import { ApolloServer } from 'apollo-server-express';
import morgan = require('morgan');
import mongoose = require('mongoose');
import http = require('http');
import cachegoose = require('cachegoose');
import DataLoader = require('dataloader');
import { ConnectionContext } from 'subscriptions-transport-ws';

import initPassport from './passport';
import schema from './graphql';
import { IDataLoaders, userIDFn, convIDFn } from './dataloaders';
import { getUsernameFromSession, deserializeUser } from './utils/access.utils';
import { IUser } from './models/user';

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

const sessionStore = new (connectMongo(session))({
	mongooseConnection: mongoose.connection,
	touchAfter: 12 * 3600, // 12h
});

const app = express();
app.use(cookieParser());
app.use(morgan('dev'));
app.use(session({
	store: sessionStore,
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
			tokenOwner: req.user.toObject(), //TODO: rename to loggedUser
		} as IContext;
	},
	subscriptions: {
		onConnect: async ({ }, { }, context: ConnectionContext) => {
			try {
				const { chatid } = cookie.parse(context.request.headers.cookie as string || '');
				const sid = cookieParser.signedCookie(chatid, process.env.SESSION_SECRET!);
				if (!sid) throw {};

				const username = await getUsernameFromSession(sid, sessionStore);
				const user = await deserializeUser(username);
				return { tokenOwner: user.toObject(), }; //TODO: rename to loggedUser
			} catch (err) {
				throw new Error('Session error or auth cookie is missing');
			}
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
