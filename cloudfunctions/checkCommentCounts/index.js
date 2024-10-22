// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const wxContext = cloud.getWXContext()
	const db = cloud.database();
	try {
		// Count all comments and replies where postId matches
		const totalCount = await db.collection('comments').where({
			postId: event.postId
		}).count();
		return {
			success: true,
			count: totalCount.total  // Returns the total number of comments and replies
		};
	} catch (error) {
		return {
			success: false,
			error: error
		};
	}
}