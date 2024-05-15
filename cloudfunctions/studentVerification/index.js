// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const wxContext = cloud.getWXContext()
	const openid = wxContext.OPENID
	const email = event.email

	// TODO: 现在还没用第三方验证
	const res = await db.collection('userInfo').doc(openid).update({
		data: {
			isUserVerified: true
		}
	})
	return {
		res
	}
}