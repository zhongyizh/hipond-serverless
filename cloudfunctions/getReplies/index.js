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
	console.log("cmtId: " + cmtId + "cmtrId: " + cmtrId + "limit: " + limit + "offset: " + offset)
	const result = await db.collection('comments').aggregate()
		.match({
			parent: cmtId
		})
		.lookup({
			from: 'userInfo',
			localField: '_openid',
			foreignField: '_id',
			as: 'userInfo',
		})
		.lookup({
			from: 'userInfo', // Fetch target user's info (_tgtId)
			localField: '_tgtId',
			foreignField: '_id',
			as: 'tgtUserInfo',
		})
		.replaceRoot({
			// newRoot: $.mergeObjects([ $.arrayElemAt(['$userInfo', 0]), '$$ROOT' ])
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
		.end()
		.then(res => {
			console.log(res)
			return res.list
		})
		.catch(err => {
			console.error(err)
			return {}
		})
	return result
}