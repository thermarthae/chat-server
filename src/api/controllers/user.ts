import express = require("express");
import mongoose = require("mongoose");
import bcrypt = require("bcrypt");
import jwt = require("jsonwebtoken");
import uuid = require("uuid");

import { secretKey } from "../../app";
import IUser = require("../models/user");

const User: mongoose.Model<IUser> = require("../models/user");

const users_get_all: express.RequestHandler = (req, res, next) => {
	User.find()
		.exec()
		.then(docs => {
			const response = {
				count: docs.length,
				products: docs.map(doc => {
					return docs;
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

const user_signup: express.RequestHandler = (req, res, next) => {
	User.find({ email: req.body.email })
		.exec()
		.then(user => {
			if (user.length >= 1) {
				return res.status(409).json({
					message: "Mail exists"
				});
			}
			bcrypt.hash(req.body.password, 10, (err, hash) => {
				if (err) {
					return res.status(500).json({
						error: err
					});
				}
				const user = new User({
					_id: uuid.v4(),
					email: req.body.email,
					password: hash
				});
				user
					.save()
					.then(result => {
						console.log(result);
						res.status(201).json({
							message: "User created"
						});
					})
					.catch((err: Error) => {
						console.log(err);
						res.status(500).json({
							error: err
						});
					});
			});
		});
};

const user_login: express.RequestHandler = (req, res, next) => {
	User.findOne({
		email: req.body.email
	})
		.select("_id email password")
		.exec()
		.then(user => {
			if (!user) {
				res.status(401);
				return next(new Error("Wrong credentials"));
			}
			bcrypt.compare(req.body.password, user.password, (err, result) => {
				try {
					if (err) throw new Error("Auth failed");

					res.status(200).json({
						message: "Authorization successful",
						token: jwt.sign({ user }, secretKey.primary, {
							expiresIn: "1h"
						})
					});
				}
				catch (error) {
					console.log(error);
					res.status(401);
					return next(error);
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

const user_delete: express.RequestHandler = (req, res, next) => {
	User.remove({
		_id: req.params.userId
	})
		.exec()
		.then(result => {
			res.status(200).json({
				message: "User deleted"
			});
		})
		.catch((err: Error) => {
			console.log(err);
			res.status(500).json({
				error: err
			});
		});
};
exports.users_get_all = users_get_all;
exports.user_signup = user_signup;
exports.user_login = user_login;
exports.user_delete = user_delete;
