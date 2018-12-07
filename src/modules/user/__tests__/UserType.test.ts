import 'ts-jest';
import UserTypes from '../UserType';

describe('User Types', () => {
	const types = UserTypes.getFields();

	test('_id', () => {
		const id = 'asdasdasd';
		const res = types._id.resolve!({ _id: id }, {}, {}, {} as any);
		expect(res).toEqual(id);
	});
});
