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

export const determineRealConvId = async (convID: string, verifiedUserId: string) => {
	if (convID.length === 25) return convID.substr(1);

	const usersIDs = [convID, String(verifiedUserId)].map(id => Types.ObjectId(id));
	const [conv, unwantedConv] = await ConversationModel.aggregate()
		.match({
			$and: [
				{ users: { $size: 2 } },
				{ users: { $all: usersIDs } }
			]
		})
		.project({ _id: 1 })
		.limit(2)
		.cache(60);

	if (!conv) throw new ValidationError('Could not determine real conversation ID');
	if (unwantedConv) throw new ValidationError('Too many conversations');

	return String(conv._id);
};
