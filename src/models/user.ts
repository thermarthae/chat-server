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
		role: {
			type: String,
			enum: ['USER', 'ADMIN'],
			default: 'USER',
			required: true,
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
	UnknownError = 'An unknown error has occurred',
	UserExistsError = 'User with the given username is already registered',
	UserNotExistsError = 'User not exist',
	MissingUsernameError = 'No username was given',
	IncorrectUsernameError = 'The specified user does not exist.',
	MissingPasswordError = 'No password was given',
	IncorrectPasswordError = 'Incorrect password',
	AttemptTooSoonError = 'Account is currently locked. Try again later',
	TooManyAttemptsError = 'Account locked due to too many failed login attempts',
	NoSaltValueStoredError = 'Authentication not possible. No salt value stored',
	AlreadyLoggedIn = 'You are already logged in. Try to log out first',
	AlreadyLoggedOut = 'You are already logged out',
	NotLoggedInForbidden = 'Access forbidden. You must be logged in',
	RightsForbidden = 'Access denied',
	PasswordIsTooShort = 'Password is too short (minimum is 8 characters)',
}


const clearUserCache = (usr: IUser) => {
	cachegoose.clearCache(usr.email + '-passport');
};

userSchema.post('findOneAndUpdate', clearUserCache);
userSchema.post('findOneAndRemove', clearUserCache);

userSchema.plugin(passportLocalMongoose, {
	usernameField: 'email',
	errorMessages: UserErrors,
	findByUsername: (model, queryParameters) => {
		const userEmail = queryParameters.$or[0].email as string;
		return model.findOne(queryParameters).select('+salt +hash').cache(30, userEmail + '-passport');
	},
});

export interface IUser extends mongoose.PassportLocalDocument {
	name: string;
	email: string;
	role: 'USER' | 'ADMIN';
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
