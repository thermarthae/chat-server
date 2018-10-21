import passport = require('passport');
import UserModel from './models/user';
import { Application } from 'express';

export default (app: Application) => {
	app.use(passport.initialize());
	app.use(passport.session());

	passport.use(UserModel.createStrategy());

	passport.serializeUser(UserModel.serializeUser());
	passport.deserializeUser(UserModel.deserializeUser());
};
