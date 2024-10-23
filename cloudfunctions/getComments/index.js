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
		const likeListRes = await db.collection('likeCmtList').where({
			_id: openid
		}).get();
		if (likeListRes.data.length === 0) {
			await db.collection('likeCmtList').add({
				data: {
					_id: openid,
					list: []
				}
			});
			console.log(`Created new likeCmtList entry for user: ${openid}`);
		}
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
		const likeCmtList = (likeListRes.data.length > 0) ? likeListRes.data[0].list : [];
		// Check if the current user has liked each comment
		const commentsWithLikes = comments.map(comment => {
			if (likeCmtList.includes(comment._id)) {
				comment.isLiked = true;
				comment.likeButtonUrl = "/image/saved_button.png";
			} else {
				comment.isLiked = false;
				comment.likeButtonUrl = "/image/not_liked_button.svg";
			}
			return comment;
		});
		console.log('comments: ', commentsWithLikes);
		return {
		  commentsWithLikes
		};
	} catch (error) {
		console.error('Error fetching comments:', error);
		return {
			success: false,
			error: error
		};
	}
}