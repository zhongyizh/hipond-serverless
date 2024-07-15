// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
	env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  try{
    const record = await db.collection('saveList').where({
      _id: openid
    }).get()
    const data = record.data[0].list
    if (data.includes(event.postId)) {
      console.log("已收藏")
      return true
    } else {
      return false
    }
  }
  catch (error)
  {
    console.error(error)
    return false
  }
	
}