async function imgSecCheck(postId = '', url = '') {
	// TODO: 因传fileId给mediaCheckAsync的话不管什么图片都能pass，原因未知，故只能用https开头的tempUrl
	const tempUrl = await new Promise((resolve, reject) => {
		console.log("⏳ security.service.js: imgSecCheck(): Fetching Image Tempfile URLs...");
		wx.cloud.getTempFileURL({
			fileList: [url],
			success: res => {
				const tempUrl = res.fileList[0].tempFileURL
				console.log("✅ security.service.js: imgSecCheck(): Image Tempfile URLs Fetched!");
				resolve(tempUrl)
			},
			fail: err => {
				console.error(err)
				reject(err)
			}
		})
	})
	const res = await new Promise((resolve, reject) => {
		console.log("⏳ security.service.js: imgSecCheck(): Checking Image Security Compliance...");
		console.log("🖼 security.service.js: imgSecCheck(): Post ID Checked: ", postId);
		console.log("🖼 security.service.js: imgSecCheck(): Image Urls Checked (tempUrl): ", tempUrl);
		wx.cloud.callFunction({
			name: 'mediaCheckAsync',
			data: {
				postId: postId,
				url: tempUrl
			},
			success: res => {
				resolve(res.result)
			},
			fail: err => {
				console.error(err)
				reject(err)
			}
		})
	})
	if (res.errCode !== 0) {
		console.error('❌ security.service.js: imgSecCheck(): 图像内容安全检查错误：' + res.errCode)
	}
	return res.traceId;
}

async function msgSecCheck(content) {
	console.log("⏳ security.service.js: msgSecCheck(): Checking Text Content Security Compliance: ", content);
	const res = await new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'msgSecCheck',
			data: {
				content: content
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
	if (res.errCode !== 0) {
		console.error('文字内容安全检查错误：' + res.errCode)
		return false
	}
	if (res.result.suggest !== 'pass') {
		return false
	}
	return true
}

module.exports = {
	msgSecCheck,
	imgSecCheck
}