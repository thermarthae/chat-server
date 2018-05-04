import {  GraphQLFieldConfig, GraphQLNonNull } from "graphql";
import { /* postType, */ postInputType } from "../types/post.types";
import { conversationType } from "../types/conversation.types";
import PostModel from "../../models/post";

export const addPost: GraphQLFieldConfig<any, any, any> = {
	// type: postType,
	type: conversationType,
	description: "Add new post",
	args: {
		payload: {
			type: new GraphQLNonNull(postInputType)
		}
	},
	resolve(source, { payload }) {
		const newPostModel = new PostModel(payload);
		const newPost = newPostModel.save();
		if (!newPost) throw new Error("Error adding post");
		return newPost;
	}
};
