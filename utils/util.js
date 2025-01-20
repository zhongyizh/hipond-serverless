function getMyUserInfo(userid) { 
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'getUserInfo',
			data: { userid },
			success: res => {
				resolve(res.result);
			},
			fail: err => {
				console.error('Failed to get current userinfo');
				reject(err);
			}
		})
	})
}

async function getLatestPosts(limit, lastPostDate) {
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'getLatestPosts',
			data: {
				limit: limit,
				lastPostDate: lastPostDate
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

async function getPaginatedPosts(limit, lastPostDate) {
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'getPaginatedPosts',
			data: {
				limit: limit,
				lastPostDate: lastPostDate
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

async function getComments(postId, limit, offset) {
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'getComments',
			data: {
				postId: postId,
				limit: limit,
				offset: offset
			},
			success: res => {
				console.log(res.result.commentsWithLikes)
				resolve(res.result.commentsWithLikes);
			},
			fail: err => {
				console.error(err)
				reject(err);
			}
		})
	})
}

async function getReplies(cmtId, cmtrId, limit, offset) {
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'getReplies',
			data: {
				cmtId: cmtId,
				cmtrId: cmtrId,
				limit: limit,
				offset: offset
			},
			success: res => {
				console.log(res.result.commentsWithLikes)
				resolve(res.result.commentsWithLikes);
			},
			fail: err => {
				console.error(err)
				reject(err);
			}
		})
	})
}

function getPostTitleFromBody(body, length = 24) {
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

function requestSubscribe() {
	// 评论和回复提醒消息订阅
	wx.requestSubscribeMessage({
		tmplIds: ['HibnKMtUXNnGm-zsmA9Ui3dJZFC3pukyanTb9tBY404', 'ko8wE9VPrWPxIG-dxmmqNfrG235V9C_gPADDR8aUTR0']
	})
}

module.exports = {
	getMyUserInfo,
	getLatestPosts,
	getPaginatedPosts,
	getPostDisplayData,
	getPostTitleFromBody,
	getComments,
	getReplies,
	requestSubscribe
}