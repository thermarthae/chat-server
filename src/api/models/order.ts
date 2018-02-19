import uuid = require("uuid");
import mongoose = require("mongoose");
import IProduct = require("./product");

const orderSchema = new mongoose.Schema({
	_id: {
		type: String,
		default: uuid.v4()
	},
	product: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Product",
		required: true
	},
	quantity: {
		type: Number,
		default: 1
	}
});

interface IOrder extends mongoose.Document {
	product: IProduct;
	quantity: number;
}

export = IOrder;
module.exports = mongoose.model<IOrder>("Order", orderSchema);
