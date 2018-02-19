import uuid = require("uuid");
import mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	_id: { 
		type: String,
		default: uuid.v4()
	},
	email: {
		type: String,
		required: true,
		unique: true,
		match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
	},
	password: {
		type: String,
		required: true
	}
});

interface IUser extends mongoose.Document {
	email: string;
	password: string;
}

export = IUser;
module.exports = mongoose.model<IUser>("User", userSchema);
