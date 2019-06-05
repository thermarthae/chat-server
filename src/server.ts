// TODO: add user password change
// TODO: add RedisStore
// TODO: rate limit
// TODO: add setDraft with convIDLoader cache clearing

import dotenv = require('dotenv');
dotenv.config();
import express = require('express');
import session = require('express-session');
import connectMongo = require('connect-mongo');
import cookie = require('cookie');
import cookieParser = require('cookie-parser');
import { ApolloServer, ApolloError } from 'apollo-server-express';
import morgan = require('morgan');
import http = require('http');
import https = require('https');
import path = require('path');
import fs = require('fs');
import { ConnectionContext, ExecutionParams } from 'subscriptions-transport-ws';

import initPassport from './passport';
import schema from './modules';
import createDataloaders, { IDataLoaders } from './dataloaders';
import { getUsernameFromSession, deserializeUser, setIsAuthCookie } from './utils/auth.utils';
import { IUser, IRequest } from './modules/user/UserModel';
import initMongoose from './initMongoose';

export interface IRootValue { }
export interface IContext extends IDataLoaders {
	req: IRequest;
	res: express.Response;
	sessionOwner: IUser | undefined;
}
export interface ISubContext {
	sessionOwner: IUser | undefined;
}

export default async () => {
	const isTest = process.env.NODE_ENV === 'test';
	const isProd = process.env.NODE_ENV === 'production';
	const isDev = process.env.NODE_ENV === 'development';
	const useHttps = process.env.HTTPS === 'true';
	if (isDev) console.log('\x1b[31m%s\x1b[0m', 'DEVELOPMENT MODE');

	const mongoose = await initMongoose().finally(() => console.log('Connected to DB'));
	if (isDev) mongoose.set('debug', true);

	const sessionStore = isTest
		? new session.MemoryStore()
		: new (connectMongo(session))({
			mongooseConnection: mongoose.connection,
			touchAfter: 12 * 3600, // 12h
		});

	const app = express();
	app.use(cookieParser());
	if (!isTest) app.use(morgan('dev'));
	app.use(session({
		store: sessionStore,
		name: 'chatid',
		secret: process.env.SESSION_SECRET!,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: isProd,
			sameSite: true,
			maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
		}
	}));
	initPassport(app);

	interface IApolloContext {
		res: express.Response;
		req: IRequest;
		connection?: ExecutionParams;
	}
	const server = new ApolloServer({
		introspection: true,
		debug: isDev,
		schema,
		tracing: true,
		context: async ({ res, req, connection }: IApolloContext) => {
			if (connection) return connection.context;
			setIsAuthCookie(res, req.isAuthenticated());

			return {
				req,
				res,
				sessionOwner: req.user ? req.user.toObject() : undefined,
				...createDataloaders(),
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
					return { sessionOwner: user.toObject(), } as ISubContext;
				} catch (err) {
					throw new ApolloError('Session error or auth cookie is missing');
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
			origin: ((isDev ? process.env.CORS_ORIGIN_DEV : process.env.CORS_ORIGIN) || '').split(', '),
			credentials: true
		}
	});

	const httpServer = !useHttps
		? http.createServer(app)
		: https.createServer(
			{
				key: fs.readFileSync(path.resolve(__dirname, '../ssl/private.key')),
				cert: fs.readFileSync(path.resolve(__dirname, '../ssl/server.crt'))
			},
			app
		);

	server.installSubscriptionHandlers(httpServer);

	httpServer.listen(process.env.SERVER_PORT as any, () => {
		const { address, port } = httpServer.address() as any;
		const url = address + ':' + port;
		const s = useHttps ? 's' : '';
		console.log(
			'\x1b[36m%s\x1b[0m',
			`GraphQL Server is now running on http${s}://${url + server.graphqlPath}`
		);
		console.log(
			'\x1b[35m%s\x1b[0m',
			`GraphQL WS is now running on ws${s}://${url + server.subscriptionsPath}`
		);
	});
};
