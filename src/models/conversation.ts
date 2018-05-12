import mongoose = require('mongoose');
import { IUserToken } from '../graphql/types/user.types';

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
				seen: [{
					user: String,
					time: String
				}],
				content: String,
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
	seen: [{
		user: string,
		time: string
	}];
	content: string;
}

export interface IConversation extends mongoose.Document {
	name: string;
	users: [string];
	draft?: [{
		_id: string;
		time: string;
		content: string;
	}];
	messages: [IMessage];
}

export interface IConversationAndTokenResult extends IConversation {
	userFromToken: IUserToken;
}

export default mongoose.model<IConversation>('conversation', conversationSchema);
