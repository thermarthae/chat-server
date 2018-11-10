import mongoose = require('mongoose');
import { IUser } from './user';

const messageSchema = new mongoose.Schema(
	{
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		conversation: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Conversation',
			required: true,
		},
		time: {
			type: Date,
			default: new Date(),
		},
		content: {
			type: String,
			required: true,
			trim: true
		}
	},
	{ collection: 'Message' }
);

export interface IMessage extends mongoose.Document {
	author: IUser;
	conversation: string;
	time: Date;
	content: string;
}

const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
export default MessageModel;
