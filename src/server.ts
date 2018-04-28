import http = require("http");

import { app } from "./app";

const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port, () =>
	console.log(
		"\x1b[36m%s\x1b[0m",
		`GraphQL Server is now running on http://localhost:${port}/graphql`
	)
);
