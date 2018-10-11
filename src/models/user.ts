import mongoose = require('mongoose');
import cachegoose = require('cachegoose');

const userSchema = new mongoose.Schema(
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
		password: {
			type: String,
			required: true
		},
		tokenSignature: {
			type: String,
			required: true,
			default: Date.now().toString()
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

const clearUserCache = (usr: IUser) => {
	cachegoose.clearCache(usr._id + '-token');
	cachegoose.clearCache(usr.email + '-access');
};

userSchema.post('findOneAndUpdate', clearUserCache);
userSchema.post('findOneAndRemove', clearUserCache);

export interface IUser extends mongoose.Document {
	name: string;
	email: string;
	password: string;
	tokenSignature: string;
	isAdmin: boolean;
}

const UserModel = mongoose.model<IUser>('User', userSchema);
export default UserModel;
