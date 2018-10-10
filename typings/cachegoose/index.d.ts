declare module 'cachegoose' {
	export = cachegoose;

	import mongoose = require('mongoose');
	function cachegoose(mongoose: mongoose.Mongoose, settings: cachegoose.ISettings): void;

	namespace cachegoose {
		export interface ISettings {
			engine?: 'memory' | 'redis' | 'mongo' | 'file';
			port: number;
			host: string;
		}

		export function clearCache(entryName?: string): void;
	}
}

declare module 'mongoose' {
	export interface DocumentQuery {
		cache(time: number, entryName?: string): this;
	}

	export interface Aggregate {
		cache(time: number, entryName?: string): this;
	}
}
