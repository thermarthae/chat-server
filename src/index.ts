import dotenv = require('dotenv');
dotenv.config();

import sourceMapSupport = require('source-map-support');
sourceMapSupport.install();

import startServer from './server';
startServer();
