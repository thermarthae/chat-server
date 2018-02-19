const Path = require("path");
const { CheckerPlugin } = require("awesome-typescript-loader");

const fs = require("fs");

let nodeModules = {};
fs.readdirSync("node_modules")
	.filter(function(x) {
		return [".bin"].indexOf(x) === -1;
	})
	.forEach(function(mod) {
		nodeModules[mod] = "commonjs " + mod;
	});

module.exports = {
	entry: Path.resolve(__dirname, "src/server.ts"),

	output: {
		path: Path.resolve(__dirname, "dist"),
		filename: "server.js"
	},

	target: "node",

	resolve: {
		extensions: [".ts", ".js"]
	},

	externals: nodeModules,

	context: Path.resolve(__dirname, "src"),

	module: {
		rules: [{
			test: /\.tsx?$/,
			use: "awesome-typescript-loader"
		}]
	},
	plugins: [
		new CheckerPlugin()
	]
};
