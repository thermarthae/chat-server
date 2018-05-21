import mongoose = require('mongoose');
import DataLoader = require('dataloader');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true
		},
		email: {
			type: String,
			required: true,
			unique: true
		},
		password: {
			type: String,
			required: true
		},
		tokenSignature: {
			type: String,
			required: true,
			default: 'undefined'
		},
		isAdmin: {
			type: Boolean,
			required: true,
			default: false
		}
	},
	{
		collection: 'user',
		timestamps: true
	}
);

export interface IUser extends mongoose.Document {
	name: string;
	email: string;
	password: string;
	tokenSignature: string;
	isAdmin: boolean;
}

const UserModel = mongoose.model<IUser>('user', userSchema);
export default UserModel;

export const userLoader = new DataLoader(async ids => {
	return await UserModel.find({ _id: { $in: ids } }).cache(10).catch(err => {
		throw err;
	}) as IUser[];
});
