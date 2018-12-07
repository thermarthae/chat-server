import 'ts-jest';
import UserConversationsType from '../UserConversationsType';

test('userConversations Types exist', () => {
	const types = UserConversationsType.getFields();
	expect(types).toBeDefined();
});
