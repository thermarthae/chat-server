import jwt = require('jsonwebtoken');

import { secretKeys, IDataLoaders } from '../';
import UserModel, { IUser } from '../models/user';
import { IUserToken } from '../graphql/types/user.types';

import { Response } from 'express-serve-static-core';


const makeNewAccessToken = (payload: IUserToken, secret: string): Promise<string> => {
	return new Promise((resolve, reject) =>
		jwt.sign(
			payload,
			secret,
			{ expiresIn: '1m' },
			(err, token) => {
				if (err) reject(err);
				else resolve(token);
			}
		)
	);
};

const makeNewRefreshToken = (payload: IUserToken, secret: string): Promise<string> => {
	return new Promise((resolve, reject) =>
		jwt.sign(
			payload,
			secret,
			{ expiresIn: '7d' },
			(err, token) => {
				if (err) reject(err);
				else resolve(token);
			}
		)
	);
};

export const makeNewTokens = async (userFromDB: IUser) => {
	const newTokenSignature = new Date().getTime();
	const payload: IUserToken = {
		_id: userFromDB._id,
		isAdmin: userFromDB.isAdmin
	};

	await UserModel.findByIdAndUpdate(
		userFromDB._id,
		{ $set: { tokenSignature: newTokenSignature } }
	).catch(() => { throw new Error('Can\'t make new token'); });

	return {
		access_token: await makeNewAccessToken(
			payload,
			secretKeys.primary + newTokenSignature
		),
		refresh_token: await makeNewRefreshToken(
			payload,
			secretKeys.secondary + newTokenSignature
		)
	};
};

export const renewTokens =  async (loaders: IDataLoaders, oldRefreshToken: string) => {
	const verifiedUser = await verifyToken(loaders, oldRefreshToken, secretKeys.secondary)
		.catch(err => {
			console.log('CATCH', err);
			throw err;
		});
	return await makeNewTokens(verifiedUser);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const setTokenCookies = (res: Response, tokens: { access_token: string, refresh_token: string }) => {
	res.cookie('token', tokens.access_token, {
		maxAge: 60 * 60 * 24 * 7,
		httpOnly: true
	});
	res.cookie('refresh-token', tokens.refresh_token, {
		maxAge: 60 * 60 * 24 * 7,
		httpOnly: true
	});
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const verifyToken = async ({ userLoader }: IDataLoaders, token: string, secret: string) => {
	const decoded = jwt.decode(token) as IUserToken;
	if (decoded.exp! < new Date().getTime() / 1000) throw new Error('Token expired');

	const userFromDB = await userLoader.load(decoded._id!);
	console.log('userFromDB.tokenSignature', userFromDB.tokenSignature);
	return new Promise((resolve, reject) =>
	jwt.verify(
		token,
		secret + userFromDB.tokenSignature,
		err => {
			if (err) reject(err);
			else resolve(userFromDB);
		}
	)
) as Promise<IUser>;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const checkIfTokenError = (verifiedToken: IUserToken | undefined) => {
	if (!verifiedToken) throw new Error('Access token error');
};

export const tokenAuthorisation = (id: string, verifiedToken: IUserToken) => {
	checkIfTokenError(verifiedToken);
	const permission = verifiedToken._id === id || verifiedToken.isAdmin;
	if (!permission) throw new Error('Permission error');
	return permission;
};
