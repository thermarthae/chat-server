declare module 'cachegoose' {
	import mongoose = require('mongoose');
	interface ISettings {
		engine?: 'redis';
		port: number;
		host: string;
	}

	function cachegoose(mongoose: mongoose.Mongoose, settings: ISettings): void;

	export = cachegoose;
}

declare module 'mongoose' {
	export function cache(time: number): void;

	export interface DocumentQuery {
		cache(time: number, entryName?: string): this;
	}

	export interface Aggregate {
		cache(time: number, entryName?: string): this;
	}
}
