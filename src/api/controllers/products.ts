import express = require("express");
import mongoose = require("mongoose");
import uuid = require("uuid");

import IProduct = require("../models/product");

const Product: mongoose.Model<IProduct> = require("../models/product");

const products_get_all: express.RequestHandler = (req, res, next) => {
	Product.find()
		.select("name price productImage")
		.exec()
		.then(docs => {
			const response = {
				count: docs.length,
				products: docs.map(doc => {
					return {
						name: doc.name,
						price: doc.price,
						productImage: doc.productImage,
						_id: doc._id,
						request: {
							type: "GET",
							url: "http://localhost:3000/products/" + doc._id
						}
					};
				})
			};
			res.status(200).json(response);
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({
				error: err
			});
		});
};

const products_create_product: express.RequestHandler = (req, res, next) => {
	const product = new Product({
		_id: uuid.v4(),
		name: req.body.name,
		price: req.body.price,
		productImage: req.file.path
	});
	product
		.save()
		.then(result => {
			res.status(201).json({
				message: "Created product successfully",
				createdProduct: {
					name: result.name,
					price: result.price,
					_id: result._id,
					request: {
						type: "GET",
						url: {
							product: "/products/" + result._id,
							productImage: "/uploads/" + req.file.filename
						}
					}
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

const products_get_product: express.RequestHandler = (req, res, next) => {
	const id = req.params.productId;
	Product.findById(id)
		.select("name price _id productImage")
		.exec()
		.then(doc => {
			console.log("From database", doc);
			if (doc) {
				res.status(200).json({
					product: doc,
					request: {
						type: "GET",
						url: "http://localhost:3000/products"
					}
				});
			}
			else {
				res.status(404).json({
					message: "No valid entry found for provided ID"
				});
			}
		})
		.catch(err => {
			console.log(err);
			res.status(500).json({
				error: err
			});
		});
};

const products_update_product: express.RequestHandler = (req, res, next) => {
	const id = req.params.productId;
	const updateOps: { [index: string]: any } = {};
	for (const ops of req.body) {
		updateOps[ops.propName] = ops.value;
	}
	Product.update(
		{
			_id: id
		},
		{
			$set: updateOps
		}
	)
		.exec()
		.then(result => {
			res.status(200).json({
				message: "Product updated",
				request: {
					type: "GET",
					url: "http://localhost:3000/products/" + id
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

const products_delete_product: express.RequestHandler = (req, res, next) => {
	const id = req.params.productId;
	Product.remove({
		_id: id
	}).exec()
		.then(result => {
			res.status(200).json({
				message: "Product deleted",
				request: {
					type: "POST",
					url: "http://localhost:3000/products",
					body: {
						name: "String",
						price: "Number"
					}
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

exports.products_get_all = products_get_all;
exports.products_create_product = products_create_product;
exports.products_get_product = products_get_product;
exports.products_update_product = products_update_product;
exports.products_delete_product = products_delete_product;
