import mongoose = require('mongoose');

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
