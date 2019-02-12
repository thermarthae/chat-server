import dotenv = require('dotenv');

//execute before all tests
export default async () => {
	dotenv.config();
};
