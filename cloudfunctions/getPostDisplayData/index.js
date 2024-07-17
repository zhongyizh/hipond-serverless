// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	var $ = db.command.aggregate
	const limit = event.limit
	const offset = event.offset
	const result = await db.collection('posts').aggregate()
		.match({
			isImgChecked: true
		})
		.lookup({
			from: 'userInfo',
			localField: '_openid',
			foreignField: '_id',
			as: 'userInfo',
		})
		.replaceRoot({
			newRoot: $.mergeObjects([ $.arrayElemAt(['$userInfo', 0]), '$$ROOT' ])
		})
		.project({
			userInfo: 0
		})
		.sort({
			postDate: -1
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