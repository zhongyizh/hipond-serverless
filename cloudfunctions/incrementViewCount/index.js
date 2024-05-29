// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  // const wxContext = cloud.getWXContext()
  const postId = event.postId
  const db = cloud.database()
  const _ = db.command
  try {
    const result = await db.collection('posts').doc(postId).update({
        data: {
          viewCount: _.inc(1)
        }
    });
    return {
      success: true,
      message: 'View count updated successfully! incrementViewCount id: ' + postId + ' updated: ' + result.stats.updated + ' doc'
    };
    } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Failed to update view count'
    };
  }
	// return {
	// 	event,
	// 	openid: wxContext.OPENID,
	// 	appid: wxContext.APPID,
	// 	unionid: wxContext.UNIONID,
	// }
}