import express = require("express");
//import graphqlHTTP = require("express-graphql");
import { graphqlExpress } from "apollo-server-express";
import bodyParser = require("body-parser");
import morgan = require("morgan");
import mongoose = require("mongoose");

import schema from "./graphql";

export interface IRootValue {
	access_token: string;
	secretKey: {
		primary: string;
		secondary: string;
	};
}

mongoose.connect(process.env.MONGO_ATLAS_URI as string)
	.then(() => console.log("Connected to DB. "))
	.catch(err => { throw err; });
// mongoose.connection
// 	.on("error", () => console.error("Failed to connect to DB."))
// 	.once("open", () => console.log("Connected to DB. "));

export const app = express();
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "POST, GET");
	res.header(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, X-Apollo-Tracing, Credentials"//Accept, Origin, X-Requested-With
	);
	res.header("Access-Control-Allow-Credentials", "true");
	if (req.method === "OPTIONS") return res.status(200).json({});
	next();
});

app.use(morgan("dev"));
app.use(
	"/graphql",
	bodyParser.json(),
	graphqlExpress((req: any) => ({
		schema,
		rootValue: {
			access_token: req.headers.authorization,
			secretKey: {
				primary: "461b2697-e354-4b45-9500-cb4b410ca993",
				secondary: "1f8bbfcb-3505-42b7-9f57-e7563eff8f25"
			}
		},
		tracing: true
	}))
);
