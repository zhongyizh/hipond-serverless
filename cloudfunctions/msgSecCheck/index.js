// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const wxContext = cloud.getWXContext()

	try {
		const result = await cloud.openapi.security.msgSecCheck({
			"openid": wxContext.OPENID,
			"scene": 2,
			"version": 2,
			"content": event.content
		})
		return result
	} catch (err) {
		return err
	}
}