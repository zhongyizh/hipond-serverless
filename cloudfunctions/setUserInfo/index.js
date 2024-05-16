// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const wxContext = cloud.getWXContext()
	const openid = wxContext.OPENID

	// TODO: .doc匹配不到的情况会报error，应该要用Try Catch
	const record = await db.collection('userInfo').where({
		_id: openid
	}).get()
	const data = record.data
	if (data.length == 1) {
		const result = await db.collection('userInfo').doc(openid).update({
			data: {
				emailAddress: event.emailAddress,
				nickname: event.nickname,
				zipcode: event.zipcode,
				phone: event.phone,
				avatarUrl: event.avatarUrl
			},
			success: function(res) {
				console.log(res)
			}
		})
		return {
			result
		}
	} else {
		const result = await db.collection('userInfo').add({
			data: {
				_id: openid, // Use openid as id for users in userInfo collection
				emailAddress: event.emailAddress,
				nickname: event.nickname,
				zipcode: event.zipcode,
				phone: event.phone,
				avatarUrl: event.avatarUrl
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