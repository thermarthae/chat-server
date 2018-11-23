import UserModel, { IUser } from '../models/user';

import { Response } from 'express';
import { BaseMemoryStore } from 'express-session';

export const setIsAuthCookie = (res: Response, isLoggedIn: boolean) => {
	res!.cookie('logged_in', isLoggedIn, { sameSite: true, maxAge: 1000 * 60 * 60 * 24 * 14 }); //14 days
};

export const getUsernameFromSession = (sid: string, store: BaseMemoryStore) => new Promise((resolve, reject) =>
	store.get(sid, (err, sess) => {
		if (err || !sess || !sess.passport) return reject(err);
		const { user } = sess!.passport;
		if (!user) reject(err);
		resolve(user);
	})
) as Promise<string>;

export const deserializeUser = (username: string) => new Promise((resolve, reject) =>
	UserModel.deserializeUser()(username, (err, res) => {
		if (err || !res) return reject(err);
		resolve(res);
	})
) as Promise<IUser>;
