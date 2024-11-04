async function getUserInfo(userid) {
	const db = wx.cloud.database();
	const userInfo = await db.collection('userInfo').doc(userid).get()
	const userData = userInfo.data
	return userData
}

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

async function getPostDisplayData(limit, lastPostDate) {
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'getPostDisplayData',
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

function throttle(func, delay) {
	let lastCall = 0;
	return function(...args) {
		const now = new Date().getTime();
		if (now - lastCall >= delay) {
			lastCall = now;
			func.apply(this, args);
		}
	};
}

module.exports = {
	getUserInfo,
	getMyUserInfo,
	getLatestPosts,
	getPostDisplayData,
	getPostTitleFromBody,
	getComments,
	getReplies,
	throttle
}