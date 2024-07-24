// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const record = await db.collection('userInfo').where({
        _id: openid
      }).get()

  console.log(record.data[0])

	return true
}