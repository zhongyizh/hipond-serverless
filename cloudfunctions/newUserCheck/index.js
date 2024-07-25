// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const record = await db.collection('userInfo').where({
      _id: openid
    }).get()

    const userData = record.data[0]

    if (!userData) {
      return false; // Handle case where user data is not found
    }

    // Check if "oldUser" attribute exists
    if (userData.oldUser === undefined) {
      // If "oldUser" does not exist, update the document
      await db.collection('userInfo').doc(openid).update({
        data: {
          oldUser: true
        }
      })
      return true; // Indicates that the attribute was set
    } else {
      return false; // Indicates that the attribute already exists
    }
  } catch (error) {
    console.error(error)
    return false; // Return false in case of error
  }
}