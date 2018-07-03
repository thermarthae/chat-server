import jwt = require('jsonwebtoken');

import { secretKeys } from '../';
import UserModel, { IUser } from '../models/user';
import { IUserToken } from '../graphql/types/user.types';

import { Request, Response } from 'express-serve-static-core';

interface IRefreshAndSignToken {
	refresh_token: string;
	sign_token: string;
}

interface ITokens extends IRefreshAndSignToken {
	access_token: string;
}

const makeAccessToken = (payload: IUserToken, secret: string): Promise<string> => {
	return new Promise((resolve, reject) =>
		jwt.sign(
			payload,
			secret,
			{ expiresIn: '1m' },
			(err, token) => {
				if (err) reject(err);
				const splitted = token.split('.');
				const parsedToken = splitted[1] + '.' + splitted[2];
				resolve(parsedToken);
			}
		)
	);
};

const makeRefreshAndSignToken = (payload: IUserToken, secret: string): Promise<IRefreshAndSignToken> => {
	return new Promise((resolve, reject) =>
		jwt.sign(
			payload,
			secret,
			{ expiresIn: '7d' },
			(err, token) => {
				if (err) reject(err);
				const splitted = token.split('.');
				resolve({
					refresh_token: splitted[1] + '.',
					sign_token: splitted[2],
				});
			}
		)
	);
};

export const makeNewTokens = async (userFromDB: IUser) => {
	const newTokenSignature = new Date().getTime();
	const payload: IUserToken = {
		sub: userFromDB._id,
		isAdmin: userFromDB.isAdmin
	};

	await UserModel.findByIdAndUpdate(
		userFromDB._id,
		{ $set: { tokenSignature: newTokenSignature } }
	).catch(() => { throw new Error('Can\'t make new token'); });

	const access_token = await makeAccessToken(payload, secretKeys.primary + newTokenSignature); //tslint:disable-line
	const { refresh_token, sign_token } = await makeRefreshAndSignToken(payload, secretKeys.secondary + newTokenSignature);
	return { access_token, refresh_token, sign_token };
};

export const renewTokens = async (oldRefreshTokenBody: string, oldSignTokenBody: string) => {
	const verifiedUser = await verifyToken(oldRefreshTokenBody + oldSignTokenBody, secretKeys.secondary)
		.catch(err => { throw err; });
	return await makeNewTokens(verifiedUser);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const setTokenCookies = (res: Response, tokens: ITokens) => {
	res.cookie('access_token', tokens.access_token, {
		maxAge: 1 * 60 * 1000,
		httpOnly: true,
		sameSite: true,
		// secure: true, //TODO __Secure-test
	});
	res.cookie('refresh_token', tokens.refresh_token, {
		maxAge: 60 * 60 * 1000 * 24 * 7,
		httpOnly: true,
		sameSite: true,
		// secure: true, //TODO __Secure-test
	});
	res.cookie('sign_token', tokens.sign_token, {
		maxAge: 60 * 60 * 1000 * 24 * 7,
		sameSite: true,
		// secure: true, //TODO __Secure-test
	});
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const tokenHeader = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.';

export const parseToken = async (req: Request, res: Response) => {
	try {
		const accessCookie = req.cookies.access_token;
		if (!accessCookie) throw new Error('No token');

		await verifyToken(accessCookie, secretKeys.primary);
		return decodeTokenUNSAFE(accessCookie);
	} catch (err) {
		const refreshCookie = req.cookies.refresh_token;
		const signCookie = req.cookies.sign_token;
		if (!refreshCookie || !signCookie) return;

		const newTokens = await renewTokens(refreshCookie, signCookie);
		setTokenCookies(res, newTokens);
		return decodeTokenUNSAFE(newTokens.access_token);
	}
};

const verifyToken = async (tokenBody: string, secret: string) => {
	const token = tokenHeader + tokenBody;
	const decoded = jwt.decode(token) as IUserToken;
	if (decoded.exp! < new Date().getTime() / 1000) throw new Error('Token expired');

	const userFromDB = await UserModel.findOne({ _id: decoded.sub }).cache(1).catch(err => {
		throw err;
	}) as IUser;

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

const decodeTokenUNSAFE = (tokenBody: string) => {
	return jwt.decode(tokenHeader + tokenBody) as IUserToken;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const checkIfTokenError = (verifiedToken: IUserToken | undefined) => {
	if (!verifiedToken) throw new Error('Access token error');
};

export const tokenAuthorisation = (id: string, verifiedToken: IUserToken) => {
	checkIfTokenError(verifiedToken);
	const permission = verifiedToken.sub === id || verifiedToken.isAdmin;
	if (!permission) throw new Error('Permission error');
	return permission;
};
