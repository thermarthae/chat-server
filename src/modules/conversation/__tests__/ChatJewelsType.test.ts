import 'ts-jest';
import ChatJewelsType from '../ChatJewelsType';

test('ChatJewelsType exist', () => {
	const types = ChatJewelsType.getFields();
	expect(types).toBeDefined();
});
