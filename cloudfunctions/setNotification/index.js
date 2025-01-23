// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

function truncateContent(body, maxLength = 20) {
    // 如果文本长度小于或等于 maxLength，直接返回
    if (body.length <= maxLength) {
        return body;
    }

    // 截取内容并确保加上省略号的总长度不超过 maxLength
    const truncatedLength = maxLength - 3; // 为省略号留出 3 个字符空间
    const truncatedContent = body.slice(0, truncatedLength);

    return truncatedContent + '...';
}

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

// 云函数入口函数
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
	for (const key in message) {
        if (message.hasOwnProperty(key) && key.startsWith('thing')) {
            // 对 thing 开头的 key 的 value 进行处理，缩减至少于20个字符
            message[key].value = truncateContent(message[key].value, 20);
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