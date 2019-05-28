/// <reference types="mongoose" />

declare module 'mongoose' {
	interface QueryFindOneAndUpdateOptions {
		arrayFilters?: Array<{}>;
	}
}