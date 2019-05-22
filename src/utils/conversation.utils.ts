import { Types } from 'mongoose';
import ConversationModel from '../modules/conversation/ConversationModel';
import { ValidationError } from 'apollo-server-core';

export const checkIfConvExist = async (parsedUserIds: string[]) => {
	const [convExist] = await ConversationModel.aggregate()
		.match({
			$and: [
				{ users: { $size: parsedUserIds.length } },
				{ users: { $all: parsedUserIds.map(id => Types.ObjectId(id)) } }
			]
		})
		.project({ _id: 1 })
		.limit(1)
		.cache(30);

	if (convExist) throw new ValidationError('Conversation already exist');
};
