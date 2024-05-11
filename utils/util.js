async function getUserInfo(userid) {
	const db = wx.cloud.database();
	const userInfo = await db.collection('user_info').doc(userid).get()
	const userData = userInfo.data
	return userData
}

function getMyUserInfo() {
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'getUserInfo',
			data: {},
			success: res => {
				resolve(res.result);
			},
			fail: err => {
				console.error('Failed to get userinfo: ' + user_id)
				reject(err);
			}
		})
	})
}

async function getPostDisplayData(limit = 20, offset = 0) {
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'getPostDisplayData',
			data: {
				limit: limit,
				offset: offset
			},
			success: res => {
				resolve(res.result);
			},
			fail: err => {
				reject(err);
			}
		})
	})
}

module.exports = {
	getUserInfo,
	getMyUserInfo,
	getPostDisplayData,
}