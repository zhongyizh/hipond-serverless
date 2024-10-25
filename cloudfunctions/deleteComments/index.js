// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const wxContext = cloud.getWXContext();
	const commentId = event.commentId;
	const parent = event.parent;
	const db = cloud.database();
	const _ = db.command;
	try {
		// Fetch the comment by ID
		const commentRes = await db.collection("comments").doc(commentId).get();
		// Remove the target comment
		await db.collection('comments').doc(commentId).remove();
		console.log("🚮 Successfully Deleted the Comment: ", commentId);
		// If the deleted comment is a reply, update the parent's repliesCount
		if (parent !== "Post") {
			await db.collection('comments').doc(parent).update({
				data: {
					repliesCount: _.inc(-1) // Decrease repliesCount by 1
				}
			});
			console.log("📉 Updated repliesCount for parent comment: ", parent);
		} else {
			// Delete all child replies (where parent = commentId)
			const childReplies = await db.collection('comments').where({
				parent: commentId
			}).get();
			// Iterate over each child reply and delete it
			for (let i = 0; i < childReplies.data.length; i++) {
				const childCommentId = childReplies.data[i]._id;
				await db.collection('comments').doc(childCommentId).remove();
				console.log(`🚮 Successfully Deleted Child Comment: ${childCommentId}`);
			}
		}
		// Return a success response
		return {
			success: true,
			message: 'Comment and its child replies were deleted successfully.'
		};
	} catch (err) {
		console.error("❌ Error while deleting comment or updating repliesCount: ", err);
		return {
			success: false,
			error: err
		};
	}
}