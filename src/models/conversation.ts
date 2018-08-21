import mongoose = require('mongoose');
import { IMessage } from './message';
import { IUser } from './user';

const conversationSchema = new mongoose.Schema(
	{
		name: String,
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

export interface IConversation extends mongoose.Document {
	name: string;
	users?: [IUser];
	draft: [{
		user: string;
		content: string;
	}];
	messages?: [IMessage];
	seen: [{
		user: string;
		time: string;
	}];
}

const ConversationModel = mongoose.model<IConversation>('Conversation', conversationSchema);
export default ConversationModel;
