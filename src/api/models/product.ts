import uuid = require("uuid");
import mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
	_id: {
		type: String,
		default: uuid.v4()
	},
	name: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	productImage: {
		type: String,
		required: true
	}
});

interface IProduct extends mongoose.Document {
	name: string;
	price: string;
	productImage: string;
}

export = IProduct;
module.exports = mongoose.model<IProduct>("Product", productSchema);
