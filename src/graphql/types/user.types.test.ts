import 'ts-jest';
import { userType } from './user.types';

describe('User Types', () => {
	const types = userType.getFields();

	test('_id', () => {
		const id = 'asdasdasd';
		const res = types._id.resolve!({ _id: id }, {}, {}, {} as any);
		expect(res).toEqual(id);
	});
});
