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
		timestamps: true
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
	cachegoose.clearCache(usr._id + '-token'); //TODO
	cachegoose.clearCache(usr.email + '-access'); //TODO
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
});


export interface IUser extends mongoose.PassportLocalDocument {
	name: string;
	email: string;
	isAdmin: boolean;
	hash?: string;
	salt?: string;
}

const UserModel = mongoose.model<IUser>('User', userSchema);
export default UserModel;
