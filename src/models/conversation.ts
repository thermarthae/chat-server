import mongoose = require('mongoose');
import { IMessage } from './message';
import { IUser } from './user';

const conversationSchema = new mongoose.Schema(
	{
		name: {
			type: String || null,
			trim: true
		},
		users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		draft: [{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			time: Date,
			content: String,
		}],
		messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
		seen: [{
			user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			time: Date
		}],
		significantlyUpdatedAt: Date
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
	time: Date;
}

export interface IConversation extends mongoose.Document {
	name: string | null;
	users?: IUser[];
	draft: IDraft | IDraft[];
	messages?: IMessage[];
	seen: ISeen | ISeen[];
	updatedAt: Date;
	createdAt: Date;
	significantlyUpdatedAt: Date;
}

const ConversationModel = mongoose.model<IConversation>('Conversation', conversationSchema);
export default ConversationModel;
