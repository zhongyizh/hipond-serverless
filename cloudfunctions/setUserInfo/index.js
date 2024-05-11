// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const wxContext = cloud.getWXContext()
	const openid = wxContext.OPENID

	const record = await db.collection('user_info').doc(openid).get()
	if (record) {
		const result = await db.collection('user_info').doc(openid).update({
			data: {
				email_address: event.email_address,
				nickname: event.nickname,
				postal_code: event.postal_code,
				wechat_id: event.wechat_id,
				avatar_url: event.avatar_url
			},
			success: function(res) {
				console.log(res)
			}
		})
		return {
			result
		}
	} else {
		const result = await db.collection('user_info').add({
			data: {
				_id: openid, // Use openid as id for users in user_info collection
				email_address: event.email_address,
				nickname: event.nickname,
				postal_code: event.postal_code,
				wechat_id: event.wechat_id,
				avatar_url: event.avatar_url
			},
			success: function(res) {
				console.log(res)
			}
		})
		return {
			result
		}
	}
}