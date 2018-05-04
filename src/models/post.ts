import mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
	{
		uid: {
			type: String,
			required: true
		},
		title: {
			type: String,
			required: true
		},
		body: {
			type: String,
			required: true
		}
	},
	{
		collection: 'post',
		timestamps: true
	}
);

export interface IPost extends mongoose.Document {
	uid: string;
	title: string;
	body: string;
}

export default mongoose.model<IPost>('post', postSchema);
