import mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
	{
		author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		time: String,
		content: String,
	},
	{
		collection: 'Message',
		timestamps: true
	}
);

export interface IMessage extends mongoose.Document {
	author: string;
	time: string;
	content: string;
}

const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
export default MessageModel;
