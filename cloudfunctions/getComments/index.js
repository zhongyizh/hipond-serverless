// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	var $ = db.command.aggregate
	const postId = event.postId
	const limit = event.limit
	const offset = event.offset
	const wxContext = cloud.getWXContext();
	const openid = wxContext.OPENID;
	try {
		// Aggregation pipeline to get the comments with user info and pagination
		const result = await db.collection('comments').aggregate()
			.match({
				postId: postId,
				_tgtCmtId: "Post",
				_tgtId: "Author"
			})
			.lookup({
				from: 'userInfo',
				localField: '_openid',
				foreignField: '_id',
				as: 'userInfo'
			})
			.replaceRoot({
				newRoot: $.mergeObjects([$.arrayElemAt(['$userInfo', 0]), '$$ROOT'])
			})
			.project({
				userInfo: 0
			})
			.sort({
				postDate: 1
			})
			.skip(offset)
			.limit(limit)
			.end();
		const comments = result.list;
		// Check if the current user has liked each comment
		const checkLikePromises = comments.map(async comment => {
		  	const likeRes = await db.collection('likeCmtList')
				.where({
					_id: openid
				})
				.get();
			const data = likeRes.data[0].list
			if (data.includes(comment._id)) {
				comment.isLiked = true
				comment.likeButtonUrl = "/image/saved_button.png"
			} else {
				comment.isLiked = false
				comment.likeButtonUrl = "/image/not_liked_button.svg"
			};
			// comment.isLiked = likeRes.data.length > 0; 
			return comment;
		});
	
		// Wait for all like checks to finish
		const commentsWithLikes = await Promise.all(checkLikePromises);
		console.log('comments: ', commentsWithLikes);
		return {
		  commentsWithLikes
		};
	} catch (error) {
		console.error('Error fetching comments:', error);
		return {};
	}
}