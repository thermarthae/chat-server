import sourceMapSupport = require('source-map-support');
const isProd = process.env.NODE_ENV === 'production';
if (!isProd) sourceMapSupport.install({ hookRequire: true });

import startServer from './server';
startServer();
