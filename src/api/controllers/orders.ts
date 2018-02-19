import express = require("express");
import mongoose = require("mongoose");
import uuid = require("uuid");

import IOrder = require("../models/order");
import IProduct = require("../models/product");

const Order: mongoose.Model<IOrder> = require("../models/order");
const Product: mongoose.Model<IProduct> = require("../models/product");

const orders_get_all: express.RequestHandler = (req, res, next) => {
	Order.find()
		.select("product quantity _id")
		.populate("product", "name")
		.exec()
		.then(docs => {
			res.status(200).json({
				count: docs.length,
				orders: docs.map(doc => {
					return {
						_id: doc._id,
						product: doc.product,
						quantity: doc.quantity,
						request: {
							type: "GET",
							url: "http://localhost:3000/orders/" + doc._id
						}
					};
				})
			});
		})
		.catch(err => {
			res.status(500).json({
				error: err
			});
		});
};

const orders_create_order: express.RequestHandler = (req, res, next) => {
	Product.findById(req.body.productId)
		.then(product => {
			if (!product) {
				res.status(404).json({
					message: "Product not found"
				});
			}
			else {
				const order = new Order({
					_id: uuid.v4(),
					quantity: req.body.quantity,
					product: req.body.productId
				});
				return order.save();
			}
		})
		.then(result => {
			console.log(result);
			res.status(201).json({
				message: "Order stored",
				createdOrder: {
					_id: result._id,
					product: result.product,
					quantity: result.quantity
				},
				request: {
					type: "GET",
					url: "http://localhost:3000/orders/" + result._id
				}
			});
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({
				error: err
			});
		});
};

const orders_get_order: express.RequestHandler = (req, res, next) => {
	Order.findById(req.params.orderId)
		.populate("product")
		.exec()
		.then(order => {
			if (!order) {
				return res.status(404).json({
					message: "Order not found"
				});
			}
			res.status(200).json({
				order: order,
				request: {
					type: "GET",
					url: "http://localhost:3000/orders"
				}
			});
		})
		.catch(err => {
			res.status(500).json({
				error: err
			});
		});
};

const orders_delete_order: express.RequestHandler = (req, res, next) => {
	Order.remove({
		_id: req.params.orderId
	})
		.exec()
		.then(result => {
			res.status(200).json({
				message: "Order deleted",
				request: {
					type: "POST",
					url: "http://localhost:3000/orders",
					body: {
						productId: "ID",
						quantity: "Number"
					}
				}
			});
		})
		.catch(err => {
			res.status(500).json({
				error: err
			});
		});
};

exports.orders_get_all = orders_get_all;
exports.orders_create_order = orders_create_order;
exports.orders_get_order = orders_get_order;
exports.orders_delete_order = orders_delete_order;
