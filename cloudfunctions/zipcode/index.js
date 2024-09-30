// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	zipcode = event.zipcode
	const geoInfo = await db.collection('zipcode').where({
		_id: zipcode
	}).get()
	return geoInfo.data.length === 1 ? geoInfo.data[0].city + ", " + geoInfo.data[0].state_id : undefined
}