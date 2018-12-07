import passport = require('passport');
import UserModel from './modules/user/UserModel';
import { Application } from 'express';

export default (app: Application) => {
	app.use(passport.initialize());
	app.use(passport.session());

	passport.use(UserModel.createStrategy());

	passport.serializeUser(UserModel.serializeUser());
	passport.deserializeUser(UserModel.deserializeUser());
};
