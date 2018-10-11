import mongoose = require('mongoose');
import { IUser } from './user';

const messageSchema = new mongoose.Schema(
	{
		author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
		time: String,
		content: {
			type: String,
			trim: true
		}
	},
	{
		collection: 'Message',
		timestamps: true
	}
);

export interface IMessage extends mongoose.Document {
	author: IUser;
	conversation: string;
	time: string;
	content: string;
}

const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
export default MessageModel;
