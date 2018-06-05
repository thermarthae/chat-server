import mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
	{
		name: {
			type: String
		},
		users: {
			type: [String],
			required: true
		},
		draft: {
			type: [{
				_id: String,
				time: String,
				content: String,
			}],
			required: false
		},
		messages: {
			type: [{
				_id: String,
				author: String,
				time: String,
				content: String,
			}],
			required: true
		},
		seen: {
			type: [{
				user: String,
				time: String
			}],
			required: true
		}
	},
	{
		collection: 'conversation',
		timestamps: true
	}
);

interface IMessage {
	_id: string;
	author: string;
	time: string;
	content: string;
}

export interface IConversation extends mongoose.Document {
	name: string;
	users: [string];
	draft: [{
		_id: string;
		time: string;
		content: string;
	}];
	messages: [IMessage];
	seen: [{
		user: string;
		time: string;
	}];
}

const ConversationModel = mongoose.model<IConversation>('conversation', conversationSchema);
export default ConversationModel;
