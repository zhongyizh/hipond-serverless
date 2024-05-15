// pages/post/new-post/new-post.js
Page({
	data: {
		fileList: [],
		gridConfig: {
      column: 3,
      width: 213,
      height: 213,
		},
		textVal: ''
	},
	textChange(res) {
		var textVal = res.detail.value;
		this.setData({
			textVal: textVal
		})
	},
	handleAdd(e) {
		const { fileList } = this.data;
		const { files } = e.detail;
		// 选择完所有图片之后，统一上传，因此选择完就直接展示
		this.setData({
			fileList: [...fileList, ...files], // 此时设置了 fileList 之后才会展示选择的图片
		});
	},
	handleRemove(e) {
		const { index } = e.detail;
		const { fileList } = this.data;
		fileList.splice(index, 1);
		this.setData({
			fileList,
		});
	},
	async onUpload() {
		// 先去add Post的内容，数据库随机给一个id
		let result = await this.uploadPostData()
		const postId = result._id
		// 再把图片都uploadFile到指定文件夹，拿到图片在云上的地址
		const { fileList } = this.data;
		let imageUrls = []
		for (let img of fileList) {
			const fileId = await this.uploadImage(postId, img.url)
			imageUrls.push(fileId)
		}
		// 最后再去update对应的Post的imageUrls
		result = await this.updatePostImageUrls(postId, imageUrls)
		wx.navigateBack()
	},
	getTitleFromBody(body, length = 24) {
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
	},
	uploadImage(postId = '', filePath = '') {
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
	},
	uploadPostData() {
		const db = wx.cloud.database();
		const body = this.data.textVal;
		return new Promise((resolve, reject) => {
			db.collection('posts').add({
				data: {
					body: body,
					title: this.getTitleFromBody(body),
					location: '',
					postDate: Date.now(),
					postType: 'life',
					viewCount: 0
				},
				success: res => {
					resolve(res);
				},
				fail: err => {
					reject(err);
				}
			})
		})
	},
	updatePostImageUrls(postId = '', urls = []) {
		const db = wx.cloud.database();
		return new Promise((resolve, reject) => {
			db.collection('posts').doc(postId).update({
				data: {
					imageUrls: urls
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
})