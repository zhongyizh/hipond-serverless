// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const _ = db.command
    const savedIdList = event.savedIdList || [];
	const $ = _.aggregate
	// const limit = event.limit
    const result = await db.collection('posts').aggregate()
		.match({
			isImgChecked: true,
			_id: _.in(savedIdList)
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
		.end()
		.then(res => {
			console.log(res)
			return {
                success: true,
                data: res.list
            }
		})
		.catch(err => {
			console.error(err)
			return {
                success: false,
                error
            }
		})
	return result
}