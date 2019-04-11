import startServer from './server';
import sourceMapSupport = require('source-map-support');

sourceMapSupport.install({
	hookRequire: true
});

startServer();
