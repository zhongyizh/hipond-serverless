// pages/post/new-post/new-post.js
import { getPostTitleFromBody, msgSecCheck } from '../../../utils/util'

Page({
	data: {
		fileList: [],
		gridConfig: {
      column: 3,
      width: 213,
      height: 213,
		},
		sizeLimit: {
			size: 5,
			unit: 'MB',
			message: '图片大小不超过5MB'
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
		const body = this.data.textVal;
		const isBodyChecked = await msgSecCheck(body)
		if (!isBodyChecked) {
			wx.showToast({
				title: '内容含违规信息',
				icon: 'error',
				duration: 2000
			})
			return false
		}

		wx.showLoading({
			title: '上传中...',
			mask: true
		})
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
		wx.hideLoading()
		wx.navigateBack()
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
					title: getPostTitleFromBody(body),
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