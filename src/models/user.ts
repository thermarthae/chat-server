import mongoose = require('mongoose');
import passportLocalMongoose = require('passport-local-mongoose');
import cachegoose = require('cachegoose');

const userSchema: mongoose.PassportLocalSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true
		},
		isAdmin: {
			type: Boolean,
			required: true,
			default: false
		}
	},
	{
		collection: 'User',
		timestamps: true,
		toObject: {
			transform: ({ }, user: IUser) => {
				delete user.salt;
				delete user.hash;
				return user;
			}
		}
	}
);

export enum UserErrors {
	UserExistsError,
	MissingUsernameError,
	IncorrectUsernameError,
	MissingPasswordError,
	IncorrectPasswordError,
	AttemptTooSoonError,
	TooManyAttemptsError,
	NoSaltValueStoredError,
	AlreadyLoggedIn,
	AlreadyLoggedOut,
	UnknownError,
}


const clearUserCache = (usr: IUser) => {
	cachegoose.clearCache(usr.email + '-passport');
};

userSchema.post('findOneAndUpdate', clearUserCache);
userSchema.post('findOneAndRemove', clearUserCache);

userSchema.plugin(passportLocalMongoose, {
	usernameField: 'email',
	errorMessages: {
		UserExistsError: 'User with the given username is already registered',
		MissingUsernameError: 'No username was given',
		IncorrectUsernameError: 'Incorrect username',
		MissingPasswordError: 'No password was given',
		IncorrectPasswordError: 'Incorrect password',
		AttemptTooSoonError: 'Account is currently locked. Try again later',
		TooManyAttemptsError: 'Account locked due to too many failed login attempts',
		NoSaltValueStoredError: 'Authentication not possible. No salt value stored',
	},
	findByUsername: (model, queryParameters) => {
		const userEmail = queryParameters.$or[0].email as string;
		return model.findOne(queryParameters).select('+salt +hash').cache(30, userEmail + '-passport');
	},
});

export interface IUser extends mongoose.PassportLocalDocument {
	name: string;
	email: string;
	isAdmin: boolean;
	hash?: string;
	salt?: string;
	updatedAt: Date;
	createdAt: Date;
}

declare global {
	namespace Express {
		interface Request { // tslint:disable-line:interface-name
			user?: IUser;
			login(user: IUser, done: (err: any) => void): void;
			login(user: IUser, options: any, done: (err: any) => void): void;
			logIn(user: IUser, done: (err: any) => void): void;
			logIn(user: IUser, options: any, done: (err: any) => void): void;
		}
	}
}

const UserModel = mongoose.model<IUser>('User', userSchema);
export default UserModel;
