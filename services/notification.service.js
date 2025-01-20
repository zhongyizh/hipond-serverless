const notificationTypeMap = new Map([
	// 评论和回复提醒消息对应的模板ID
    ["newComment", "HibnKMtUXNnGm-zsmA9Ui3dJZFC3pukyanTb9tBY404"],
    ["newReply", "ko8wE9VPrWPxIG-dxmmqNfrG235V9C_gPADDR8aUTR0"]
]); 

function requestSubscribe() {
	// 评论和回复提醒消息订阅
	wx.requestSubscribeMessage({
		tmplIds: [notificationTypeMap.get("newComment"), notificationTypeMap.get("newReply")]
	})
}

async function setNotification(data) {
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: 'setNotification',
            data: data,
            success: res => {
                console.log('setNotification success', res);
                resolve(res.result);
            },
            fail: err => {
                console.error('setNotification fail', err);
                reject(err);
            }
        });
    });
}

async function sendNotification(id) {
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'sendNotification',
			data: {
				notificationId: id
			},
            success: res => {
                console.log('sendNotification success', res);
                resolve(res);
            },
            fail: err => {
                console.error('sendNotification fail', err);
                reject(err);
            }
		})
	});
}

module.exports = {
	notificationTypeMap,
	requestSubscribe,
	setNotification,
	sendNotification
}