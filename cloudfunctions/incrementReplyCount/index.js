// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const wxContext = cloud.getWXContext()
	const parent = event.parent
	const db = cloud.database()
	const _ = db.command
	try {
		const result = db.collection('comments').doc(parent).update({
			data: {
				repliesCount: _.inc(1)
			}
		});
		return {
			success: true,
			message: '✔ post.service.js: createComment(): Incremented repliesCount for comment: ' + parent
		};
	} catch (error) {
		console.error(error);
		return {
		  success: false,
		  message: 'Failed to update view count for comment: ' + parent
		};
	}
}