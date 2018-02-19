import express = require("express");
import jwt = require("jsonwebtoken");

import { secretKey } from "../../app";


const checkAuth: express.RequestHandler = (req, res, next) => {
	try {
		const header = req.headers.authorization;
		if (!header) throw new Error("Authorization header error");

		const token = (header as string).split(" ")[1];
		jwt.verify(token, secretKey.primary);

		next();
	}
	catch (error) {
		console.log(error);
		res.status(403);
		return next(error);
	}
};

module.exports = checkAuth;
