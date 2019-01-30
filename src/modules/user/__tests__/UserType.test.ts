import 'ts-jest';
import UserTypes from '../UserType';
import { TFieldMap } from 'Test/utils';

describe('User Types', () => {
	const types = UserTypes.getFields() as TFieldMap;

	test('_id', () => {
		const id = 'asdasdasd';
		const res = types._id.resolve!({ _id: id }, {}, {}, {} as any);
		expect(res).toEqual(id);
	});
});
