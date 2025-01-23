// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	try {
		const notification = await db.collection('notifications').where({
			_id: event.notificationId
		}).get()
		const data = notification.data[0]
		const result = await cloud.openapi.subscribeMessage.send({
			"touser": data.toUser,
			"page": data.page,
			"data": data.message,
			"templateId": data.templateId
		})
		return result
	} catch (err) {
		return err
	}
}