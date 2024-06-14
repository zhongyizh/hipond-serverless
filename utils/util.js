async function getUserInfo(userid) {
	const db = wx.cloud.database();
	const userInfo = await db.collection('userInfo').doc(userid).get()
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
				console.error('Failed to get current userinfo')
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
				console.error(err)
				reject(err);
			}
		})
	})
}

function getPostTitleFromBody(body, length = 24) {
	// TODO: 好像有一些中文符号没匹配？或者是不用匹配？
	// 取正文的前一部分作为标题，匹配中文、英文、数字和常见中英文标点符号
	const pattern = /^[\u4e00-\u9fa5\w\d\s,.?!:;，。？！：；—-‘’“”"()（）【】《》<>【】「」]+/;
	const match = body.match(pattern);
	let title = '';
	if (match) {
		title = match[0].slice(0, length)
	} else {
		title = body.slice(0, length)
	}
	if (body.length >= length) {
		title += '...'
	}
	return title
}

function uploadImage(postId = '', filePath = '') {
	return new Promise((resolve, reject) => {
		wx.cloud.uploadFile({
			cloudPath: 'postImages/' + postId + '/' + filePath.split('/').pop(),
			filePath: filePath,
			success: res => {
				resolve(res.fileID);
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
	getPostTitleFromBody,
	uploadImage,
}