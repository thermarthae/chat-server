// Type definitions for cachegoose
// Project: https://github.com/boblauer/cachegoose
// Definitions by: thermarthae <https://github.com/thermarthae>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.0.3

/// <reference types="mongoose" />

declare module 'cachegoose' {
	export = cachegoose;

	import mongoose = require('mongoose');
	function cachegoose(mongoose: mongoose.Mongoose, settings?: cachegoose.ISettings | {}): void;

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
	interface ICachegoose {
		cache(time: number, entryName?: string): this;
		getCacheKey(): string;
	}

	export interface DocumentQuery<T, DocType extends Document> extends ICachegoose { }
	export interface Aggregate<T> extends ICachegoose { }
}
