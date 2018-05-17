import jwt = require('jsonwebtoken');

import { IRootValue } from '../';
import UserModel, { IUser } from '../models/user';
import { IUserToken } from '../graphql/types/user.types';

export default class TokenUtils {
	public static async newAccessToken(payload: any, secretKey: string) {
		return new Promise((resolve, reject) =>
			jwt.sign(payload, secretKey, { expiresIn: '1y' }, (err, token) => {
				if (err) reject(err);
				else resolve(token);
			})
		);
	}

	public static async newRefreshToken(payload: any, secretKey: string, password: string) {
		return new Promise((resolve, reject) =>
			jwt.sign(
				payload,
				secretKey + password,
				{ expiresIn: '7d' },
				(err, token) => {
					if (err) reject(err);
					else resolve(token);
				}
			)
		);
	}

	public static async newTokenSignature(UserId: string) {
		const newTokenSignature = new Date().getTime();

		await UserModel.findByIdAndUpdate(UserId, {
			$set: { tokenSignature: newTokenSignature }
		}).catch(err => {
			throw new Error('Can\'t make new token signature');
		});

		return newTokenSignature;
	}

	public static verifyAccessToken({ access_token, secretKey }: IRootValue): IUserToken {
		try {
			if (!access_token) throw new Error('No access token');
			const token = access_token.split(' ', 2)[1] || 'malformed';

			return jwt.verify(token, secretKey.primary) as IUserToken;
		} catch (err) {
			return { error: err.message };
		}
	}

	public static async verifyRefreshToken(secretKey: string, token: string) {
		const decoded = jwt.decode(token) as IUserToken;
		const userFromDB: IUser = await UserModel.findOne({ _id: decoded._id })
			.catch(err => {
				throw new Error('User not found');
			});
		jwt.verify(
			token,
			secretKey + userFromDB.password + userFromDB.tokenSignature
		);

		return userFromDB;
	}

	public static checkIfAccessTokenIsVerified(verifiedToken: IUserToken) {
		if (verifiedToken.error) throw new Error(verifiedToken.error);
	}

	public static async checkPermissions(id: string, verifiedToken: IUserToken) {
		this.checkIfAccessTokenIsVerified(verifiedToken);
		const permission = verifiedToken._id === id || verifiedToken.isAdmin;
		if (!permission) throw new Error('Permission error');
		return permission;
	}
}
