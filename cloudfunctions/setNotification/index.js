// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
async function getNickname(userId) {
	// 根据openid获取用户昵称
	const db = cloud.database()
	const userInfo = await db.collection('userInfo').where({
		_id: userId
	}).get()
	const userRes = userInfo.data.length === 1 ? userInfo.data[0] : {}
	let userName = "未登录用户"
	if (userRes && userRes.nickname) {
		console.log("userRes && userRes.nickname")
		userName = userRes.nickname
	}
	return userName
}

exports.main = async (event, context) => {
	const db = cloud.database()
	const wxContext = cloud.getWXContext()
	const openid = wxContext.OPENID
	const nickname = await getNickname(openid)
	let message = event.data
	if (event.type === "newComment") {
		message.thing5 = {
			value: nickname
		}
	}
	else if (event.type === "newReply") {
		message.thing7 = {
			value: nickname
		}
	}


    try {
        // 添加记录到notifications表
        const result = await db.collection('notifications').add({
            data: {
                toUser: event.toUser,
                templateId: event.templateId,
                page: event.page,
				message: message,
				type: event.type,
				isRead: event.isRead
            }
        });
        // 确保写入完成并返回 notificationId
        const notificationId = result._id;
        console.log("Notification added successfully, ID:", notificationId);
        return notificationId;
    } catch (err) {
        console.error("Failed to add notification:", err);
        throw new Error("DB notifications table write failed");
    }
}