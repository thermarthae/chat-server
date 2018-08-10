import mongoose = require('mongoose');
import { IUser } from './user';

const messageSchema = new mongoose.Schema(
	{
		author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
		time: String,
		content: String,
	},
	{
		collection: 'Message',
		timestamps: true
	}
);

export interface IMessage extends mongoose.Document {
	author: IUser;
	time: string;
	content: string;
}

const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
export default MessageModel;
