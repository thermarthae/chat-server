import jwt = require("jsonwebtoken");

import { IRootValue } from "../";
import UserModel, { IUser } from "../models/user";
import { IUserToken } from "../graphql/types/user.types";

export const makeAccessToken = (payload: any, secretKey: string) => {
	return new Promise((resolve, reject) =>
		jwt.sign(payload, secretKey, { expiresIn: "1h" }, (err, token) => {
			if (err) reject(err);
			else resolve(token);
		})
	);
};

export const makeRefreshToken = (payload: any, secretKey: string, password: string) => {
	return new Promise((resolve, reject) =>
		jwt.sign(
			payload,
			secretKey + password,
			{ expiresIn: "7d" },
			(err, token) => {
				if (err) reject(err);
				else resolve(token);
			}
		)
	);
};

export const checkToken = ({ access_token, secretKey }: IRootValue) => {
	// if (!access_token) throw new Error("No access token");
	// const token = access_token.split(" ", 2)[1] || "malformed";
	// return jwt.verify(token, secretKey.primary) as IUserToken;
	return true;
};

export const checkRefreshToken = async (secretKey: string, token: string) => {
	const decoded = jwt.decode(token) as IUserToken;
	const userFromDB: IUser = await UserModel.findOne({
		_id: decoded._id
	}).catch(err => {
		throw new Error("User not found");
	});
	jwt.verify(
		token,
		secretKey + userFromDB.password + userFromDB.tokenSignature
	);

	return userFromDB;
};

export const checkPermissions = (id: string, source: IRootValue) => {
	// const token = checkToken(source);
	// const permission = token._id === id || token.isAdmin;
	// if (!permission) throw new Error("Permission error");
	// return permission;
	return true;
};

export const makeNewTokenSignature = async (UserId: string) => {
	const newTokenSignature = new Date().getTime();

	await UserModel.findByIdAndUpdate(UserId, {
		$set: { tokenSignature: newTokenSignature }
	}).catch(err => {
		throw new Error("Can't make new token signature");
	});

	return newTokenSignature;
};
