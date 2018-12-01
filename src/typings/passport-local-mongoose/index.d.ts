// Type definitions for passport-local-mongoose 5.0.1
// Project: https://github.com/saintedlama/passport-local-mongoose
// Definitions by: Linus Brolin <https://github.com/linusbrolin>
//                 thermarthae <https://github.com/thermarthae>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.1.3

/// <reference types="mongoose" />
/// <reference types="passport-local" />

declare module 'mongoose' {
	import passportLocal = require('passport-local');

	// methods
	export interface PassportLocalDocument extends Document {
		setPassword(password: string, cb: (err: any, res: this) => void): void; //TODO
		authenticate(password: string, cb: (err: any, res: this, error: any) => void): void; //TODO
	}

	// statics
	interface PassportLocalModel<T extends Document> extends Model<T> {
		authenticate(): (username: string, password: string) => Promise<{ user: T | false, error?: PassportLocalErrorResponse }>;
		authenticate(): (username: string, password: string, cb: (err: any, res: T, error: any) => void) => void;
		serializeUser(): (user: PassportLocalModel<T>, cb: (err: any, id?: any) => void) => void;
		deserializeUser(): (username: string, cb: (err: any, user?: any) => void) => void;
		register(user: T, password: string): DocumentQuery<T | null, T>;
		register(user: T, password: string, cb: (err: any, account: T) => void): void;
		findByUsername(username: string, selectHashSaltFields: boolean): DocumentQuery<T | null, T>;
		findByUsername(username: string, selectHashSaltFields: boolean, cb: (err: any, account: T | null) => void): any;
		createStrategy(): passportLocal.Strategy;
	}

	// error messages
	export interface PassportLocalErrorMessages {
		MissingPasswordError?: string;
		AttemptTooSoonError?: string;
		TooManyAttemptsError?: string;
		NoSaltValueStoredError?: string;
		IncorrectPasswordError?: string;
		IncorrectUsernameError?: string;
		MissingUsernameError?: string;
		UserExistsError?: string;
	}

	export interface PassportLocalErrorResponse extends PassportLocalErrorMessages {
		name: string;
		message: string;
	}

	// plugin options
	export interface PassportLocalOptions {
		saltlen?: number;
		iterations?: number;
		keylen?: number;
		digestAlgorithm?: string;
		interval?: number;
		maxInterval?: number;
		usernameField?: string;
		usernameUnique?: boolean;
		saltField?: string;
		hashField?: string;
		attemptsField?: string;
		lastLoginField?: string;
		selectFields?: string;
		usernameLowerCase?: boolean;
		populateFields?: string;
		encoding?: string;
		limitAttempts?: boolean;
		maxAttempts?: number;
		passwordValidator?: (password: string, cb: (err: any) => void) => void;
		usernameQueryFields?: Array<string>;
		findByUsername?: (model: PassportLocalModel<any>, queryParameters: any) => void;

		errorMessages?: PassportLocalErrorMessages;
	}

	export interface PassportLocalSchema extends Schema {
		plugin(
			plugin: (schema: PassportLocalSchema, options?: PassportLocalOptions) => void,
			opts?: PassportLocalOptions
		): this;
	}

	export function model<T extends Document>(
		name: string,
		schema?: PassportLocalSchema,
		collection?: string,
		skipInit?: boolean): PassportLocalModel<T>;

	export function model<T extends Document, U extends PassportLocalModel<T>>(
		name: string,
		schema?: PassportLocalSchema,
		collection?: string,
		skipInit?: boolean): U;
}

declare module 'passport-local-mongoose' {
	import mongoose = require('mongoose');
	var _: (schema: mongoose.Schema, options?: Object) => void;
	export = _;
}
