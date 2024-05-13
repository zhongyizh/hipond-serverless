// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const wxContext = cloud.getWXContext()
	const openid = wxContext.OPENID
	const userid = event.userid ? event.userid : openid

	const userInfo = await db.collection('user_info').where({
		_id: userid
	}).get()
	return userInfo.data.length == 1 ? userInfo.data[0] : {}
}