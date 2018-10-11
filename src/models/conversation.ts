import mongoose = require('mongoose');
import { IMessage } from './message';
import { IUser } from './user';

const conversationSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true
		},
		users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		draft: [{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			time: String,
			content: String,
		}],
		messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
		seen: [{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			time: String
		}]
	},
	{
		collection: 'Conversation',
		timestamps: true
	}
);

interface IDraft {
	user: string;
	content: string;
}

interface ISeen {
	user: string;
	time: string;
}

export interface IConversation extends mongoose.Document {
	name: string;
	users?: IUser[];
	draft: IDraft | IDraft[];
	messages?: IMessage[];
	seen: ISeen | ISeen[];
}

const ConversationModel = mongoose.model<IConversation>('Conversation', conversationSchema);
export default ConversationModel;
