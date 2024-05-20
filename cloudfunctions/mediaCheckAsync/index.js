// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const wxContext = cloud.getWXContext()

	try {
    const result = await cloud.openapi.security.mediaCheckAsync({
			"openid": wxContext.OPENID,
			"media_type": 2,
			"scene": 3,
			"version": 2,
			"media_url": event.url
		})
		if (result.errCode === 0) {
			await db.collection('imageCheckStatus').add({
				data: {
					_id: result.traceId,
					postId: event.postId,
					isChecked: false
				}
			})
		}
    return result
  } catch (err) {
    return err
  }
}