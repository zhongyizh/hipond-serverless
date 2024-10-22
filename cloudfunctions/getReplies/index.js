// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	var $ = db.command.aggregate
	const cmtId = event.cmtId
	const cmtrId = event.cmtrId
	const limit = event.limit
	const offset = event.offset
	const wxContext = cloud.getWXContext();
	const openid = wxContext.OPENID;
	console.log("cmtId: " + cmtId + "cmtrId: " + cmtrId + "limit: " + limit + "offset: " + offset)
	try {
		// Aggregation pipeline to get the comments with user info and pagination
		const result = await db.collection('comments').aggregate()
			.match({
				parent: cmtId
			})
			.lookup({
				from: 'userInfo',
				localField: '_openid',
				foreignField: '_id',
				as: 'userInfo'
			})
			.lookup({
				from: 'userInfo', // Fetch target user's info (_tgtId)
				localField: '_tgtId',
				foreignField: '_id',
				as: 'tgtUserInfo',
			})
			.replaceRoot({
				newRoot: $.mergeObjects([
					$.arrayElemAt(['$userInfo', 0]), 
					'$$ROOT',
					{
						_tgtusername: $.arrayElemAt(['$tgtUserInfo.nickname', 0]) // Add _tgtusername field
					}
				])
			})
			.project({
				userInfo: 0,
				tgtUserInfo: 0
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
	// const result = await db.collection('comments').aggregate()
	// 	.match({
	// 		parent: cmtId
	// 	})
	// 	.lookup({
	// 		from: 'userInfo',
	// 		localField: '_openid',
	// 		foreignField: '_id',
	// 		as: 'userInfo',
	// 	})
	// 	.lookup({
	// 		from: 'userInfo', // Fetch target user's info (_tgtId)
	// 		localField: '_tgtId',
	// 		foreignField: '_id',
	// 		as: 'tgtUserInfo',
	// 	})
	// 	.replaceRoot({
	// 		// newRoot: $.mergeObjects([ $.arrayElemAt(['$userInfo', 0]), '$$ROOT' ])
	// 		newRoot: $.mergeObjects([
	// 			$.arrayElemAt(['$userInfo', 0]), 
	// 			'$$ROOT',
	// 			{
	// 				_tgtusername: $.arrayElemAt(['$tgtUserInfo.nickname', 0]) // Add _tgtusername field
	// 			}
	// 		])
	// 	})
	// 	.project({
	// 		userInfo: 0,
	// 		tgtUserInfo: 0
	// 	})
	// 	.sort({
	// 		postDate: 1
	// 	})
	// 	.skip(offset)
	// 	.limit(limit)
	// 	.end()
	// 	.then(res => {
	// 		console.log(res)
	// 		return res.list
	// 	})
	// 	.catch(err => {
	// 		console.error(err)
	// 		return {}
	// 	})
	// return result
}