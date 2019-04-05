import 'ts-jest';
import * as faker from 'faker';
import MessageFeedType from '../MessageFeedType';
import { TFieldMap } from 'Test/utils';

describe('MessageFeed Types', () => {
	const types = MessageFeedType.getFields() as TFieldMap;

	describe('cursor', () => {
		test('when arg is right', () => {
			const node = [{ _id: faker.random.uuid() }, { _id: faker.random.uuid() }];
			const res = types.cursor.resolve!({ node }, {}, {}, {} as any);
			expect(res).toEqual(node[0]._id);
		});
		test('when arg is undefined', () => {
			const node = undefined;
			const res = types.cursor.resolve!({ node }, {}, {}, {} as any);
			expect(res).toEqual(null);
		});
		test('when arg arr is empty', () => {
			const node: never[] = [];
			const res = types.cursor.resolve!({ node }, {}, {}, {} as any);
			expect(res).toEqual(null);
		});
		test('when arg arr items does not contain _id', () => {
			const node = ['1', '2', '3'];
			const res = types.cursor.resolve!({ node }, {}, {}, {} as any);
			expect(res).toEqual(null);
		});
	});

	describe('noMore', () => {
		test('when arg is true', () => {
			const noMore = true;
			const res = types.noMore.resolve!({ noMore }, {}, {}, {} as any);
			expect(res).toEqual(noMore);
		});
		test('when arg is false', () => {
			const noMore = false;
			const res = types.noMore.resolve!({ noMore }, {}, {}, {} as any);
			expect(res).toEqual(noMore);
		});
		test('when arg is undefined', () => {
			const noMore = undefined;
			const res = types.noMore.resolve!({ noMore }, {}, {}, {} as any);
			expect(res).toEqual(null);
		});
		test('when arg is not boolean', () => {
			const noMore = {};
			const res = types.noMore.resolve!({ noMore }, {}, {}, {} as any);
			expect(res).toEqual(null);
		});
	});

	describe('node', () => {
		test('when arg is right', () => {
			const node = ['1', '2', '3'];
			const res = types.node.resolve!({ node }, {}, {}, {} as any);
			expect(res).toEqual(node);
		});
		test('when arg is undefined', () => {
			const node = undefined;
			const res = types.node.resolve!({ node }, {}, {}, {} as any);
			expect(res).toEqual([]);
		});
	});
});
