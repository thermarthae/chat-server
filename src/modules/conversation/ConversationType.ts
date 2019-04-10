import {
	GraphQLObjectType,
	GraphQLObjectTypeConfig,
	GraphQLNonNull,
	GraphQLString,
	GraphQLID,
	GraphQLList,
	GraphQLBoolean,
	GraphQLInt,
} from 'graphql';
import mongoose = require('mongoose');
import { IConversation } from './ConversationModel';
import MessageModel, { IMessage } from '../message/MessageModel';
import UserType from '../user/UserType';
import messageFeedType, { IMessageFeed } from '../message/MessageFeedType';
import { IContext } from '../../server';
import { UserInputError } from 'apollo-server-core';

const isArr = (arg: any): arg is any[] => !arg.user;

const conversationType = new GraphQLObjectType({
	name: 'Conversation',
	fields: () => ({
		_id: {
			type: new GraphQLNonNull(GraphQLID),
			resolve: ({ _id }) => String(_id)
		},
		name: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: ({ name, users }, { }, { sessionOwner }) => {
				if (name) return name;
				const usersWithoutCurrent = users!.filter(user => !sessionOwner!._id.equals(user._id));
				const usersName = usersWithoutCurrent.map(user => user.name);
				return usersName.join(', ');
			}
		},
		users: {
			type: new GraphQLNonNull(new GraphQLList(UserType)),
			resolve: ({ users }, { }, { sessionOwner }) =>
				users!.filter(user => !sessionOwner!._id.equals(user._id))
		},
		seen: {
			type: new GraphQLNonNull(GraphQLBoolean),
			resolve: ({ seen, significantlyUpdatedAt }, { }, { sessionOwner }) => {
				significantlyUpdatedAt = new Date(significantlyUpdatedAt);
				const userSeen = isArr(seen) ? seen.find(s => sessionOwner!._id.equals(s.user))! : seen;
				if (!userSeen) return false;
				const seenTime = new Date(userSeen.time);
				return significantlyUpdatedAt.getTime() <= seenTime.getTime();
			}
		},
		draft: {
			type: new GraphQLNonNull(GraphQLString),
			resolve: ({ draft }, { }, { sessionOwner }) => {
				const userD = isArr(draft) ? draft.find(d => sessionOwner!._id.equals(d.user)) : draft;
				return !userD ? '' : userD.content;
			}
		},
		messageFeed: {
			type: new GraphQLNonNull(messageFeedType),
			args: {
				limit: {
					type: GraphQLInt,
					description: 'Number of messages to fetch',
					defaultValue: 10
				},
				cursor: {
					type: GraphQLID,
					description: 'Return messages from before the cursor'
				},
			},
			resolve: async ({ _id, messages, users }, { limit, cursor }): Promise<IMessageFeed> => {
				if (limit < 1) throw new UserInputError('Limit must be greater than 0');
				cursor = cursor ? mongoose.Types.ObjectId(cursor) : null;
				let node: IMessage[] = [];
				let noMore: boolean | undefined;

				const msgsArePopulated = !!messages[0].content;
				if (msgsArePopulated) {
					const reversed = [...messages].reverse();
					if (cursor) {
						const cursorIndex = reversed.findIndex(msg => cursor.equals(msg._id));
						if (cursorIndex < 0) throw new UserInputError('Message with id equal to cursor does not exist');
						const fromIndex = cursorIndex + 1;
						node = reversed.splice(fromIndex, limit).reverse();
						noMore = limit > reversed.length;
					}
					else {
						noMore = limit >= reversed.length;
						node = reversed.splice(0, limit).reverse();
					}
				}
				else {
					const res = await MessageModel.aggregate()
						.match({ conversation: mongoose.Types.ObjectId(_id) })
						.sort({ _id: -1 })
						.lookup({
							from: 'User',
							foreignField: '_id',
							localField: 'author',
							as: 'author'
						})
						.unwind('$author')
						.group({ _id: null, msgsNode: { $push: '$$ROOT' } })
						.project({
							msgsNode: 1,
							cursorIndex: !cursor ? { $sum: 0 } : { $indexOfArray: ['$msgsNode._id', cursor] }
						})
						.match({ cursorIndex: { $ne: -1 } })
						.project({
							msgsNode: 1,
							cursorIndex: !cursor ? 1 : { $sum: ['$cursorIndex', 1] }
						})
						.project({
							msgsNode: { $reverseArray: { $slice: ['$msgsNode', '$cursorIndex', limit] } },
							debug: '$cursorIndex',
							noMoreMsgs: {
								$cond: {
									if: { $gte: [limit, { $subtract: [{ $size: '$msgsNode' }, '$cursorIndex'] }] },
									then: true,
									else: false
								}
							}
						})
						.cache(30) as [{ msgsNode: IMessage[] | null; noMoreMsgs: boolean | null } | undefined];

					// TODO: Remove 'as any' when destructuring issue is resolved
					// See: https://github.com/Microsoft/TypeScript/issues/26235
					const [{ msgsNode, noMoreMsgs } = {} as any] = res;
					if (!msgsNode) throw new UserInputError('Message with id equal to cursor does not exist');

					node = msgsNode;
					noMore = noMoreMsgs;
				}

				return { node, noMore };
			}
		}
	})
} as GraphQLObjectTypeConfig<IConversation & { messages: IMessage }, IContext>);
export default conversationType;
