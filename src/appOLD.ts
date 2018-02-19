//import path = require("path");
import express = require("express");
import morgan = require("morgan");
import bodyParser = require("body-parser");
import mongoose = require("mongoose");

// export const primarySecretKey = "461b2697-e354-4b45-9500-cb4b410ca993";
// export const secondarySecretKey = "1f8bbfcb-3505-42b7-9f57-e7563eff8f25";
// const secretKey = {
// 	primary: "461b2697-e354-4b45-9500-cb4b410ca993",
// 	secondary: "1f8bbfcb-3505-42b7-9f57-e7563eff8f25"
// };

// const productRoutes = require("./api/routes/products");
// const orderRoutes = require("./api/routes/orders");
// const userRoutes = require("./api/routes/user");

//mongoose.connect(process.env.MONGO_ATLAS_URI as string);
mongoose.connect("mongodb://admin:admin1@node-rest-shard-00-00-9xprq.mongodb.net:27017,node-rest-shard-00-01-9xprq.mongodb.net:27017,node-rest-shard-00-02-9xprq.mongodb.net:27017/test?ssl=true&replicaSet=node-rest-shard-0&authSource=admin")
.then(() => console.log("connected to db"));
mongoose.Promise = global.Promise;

const app = express();
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization"
	);
	if (req.method === "OPTIONS") {
		res.header(
			"Access-Control-Allow-Methods",
			"PUT, POST, PATCH, DELETE, GET"
		);
		return res.status(200).json({});
	}
	next();
});

// Routes which should handle requests
// app.use("/products", productRoutes);
// app.use("/orders", orderRoutes);
// app.use("/user", userRoutes);
//app.use('/uploads', express.static((path.join(__dirname, "uploads"))));

app.use((req, res, next) => {
	const error = new Error("Not found");
	res.status(404);
	next(error);
});

app.use(((error, req, res, next) => {
	const status = error.status || res.statusCode || 500;
	res.status(status);
	res.json({
		error: {
			name: error.name,
			message: error.message,
			expiredAt: error.expiredAt,
			statusCode: status,
			request: {
				method: req.method,
				url: req.url
			}
		}
	});
}) as express.ErrorRequestHandler);

module.exports = app;
