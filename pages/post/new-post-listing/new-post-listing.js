// pages/post/new-post-listing/new-post-listing.js
const errMsg = new Map([
	["text", "标题不能为空"],
	["body", "需要物品描述"],
	["price", "请输入价格"],
	["image", "请选至少一张图"]
]);

Page({
	data: {
		fileList: [],
		gridConfig: {
      column: 9,
      width: 213,
      height: 213,
		},
		condition: '全新/仅开箱',
		title: '',
		body: '',
		price: '',
		actionSheetItems: ['全新/仅开箱', '良好/轻微使用', '一般/工作良好', '需修理/零件可用'],
		isActionSheetHidden: true,
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
	actionSheetTap: function(e) {
		this.setData({
			isActionSheetHidden: false
		});
	},
	actionSheetItemTap: function(e) {
		let clickedItem = e.currentTarget.dataset.clickedItem;
		this.setData({
			isActionSheetHidden: true,
			condition: clickedItem
		});
	},
	actionSheetChange: function(e) {
		this.setData({
			isActionSheetHidden: true
		});
	},
	inputText: function(res) {
		switch(res.currentTarget.id) {
			case "body":
				this.data.body = res.detail.value;
				break;
			case "price":
				this.data.price = res.detail.value; //TODO: 确认价格的输入限制
				break;
			case "title":
				this.data.title = res.detail.value;
				break;
			default: 
				console.error("Unrecognized Input Box id");
				break;
		}
	},
	validateForm: function(payloads) {
		for (const [key, value] of Object.entries(payloads[0])) {
			if (errMsg.has(key))
				if (value == "") {
					wx.showToast({
						title: errMsg.get(key),
						icon: 'error',
						duration: 2000
					});
					return false;
				}
		}
		if (payloads[1].length <= 0) {
			wx.showToast({
				title: errMsg.get("image"),
				icon: 'error',
				duration: 2000
			});
			return false;
		}
		return true;
	},
	async upload() {
		var payload = {
			'title': this.data.title,
			'body': this.data.body,
			'price': this.data.price,
			'location': '',
			'condition': this.data.condition,
			'post_date': Date.now(),
			'post_type': 'selling',
			'view_count': 0
		}
		var images = this.data.fileList
		if (!this.validateForm([payload, images])) return false

		// 先去add Post的内容，数据库随机给一个id
		let result = await this.uploadPostData(payload)
		const postId = result._id
		// 再把图片都uploadFile到指定文件夹，拿到图片在云上的地址
		const { fileList } = this.data;
		let imageUrls = []
		for (let img of fileList) {
			const fileId = await this.uploadImage(postId, img.url)
			imageUrls.push(fileId)
		}
		// 最后再去update对应的Post的image_urls
		result = await this.updatePostImageUrls(postId, imageUrls)
		wx.navigateBack()
	},
	uploadPostData(payload) {
		const db = wx.cloud.database();
		return new Promise((resolve, reject) => {
			db.collection('posts').add({
				data: payload,
				success: res => {
					resolve(res);
				},
				fail: err => {
					reject(err);
				}
			})
		})
	},
	uploadImage(postId = '', filePath = '') {
		return new Promise((resolve, reject) => {
			wx.cloud.uploadFile({
				cloudPath: 'post_images/' + postId + '/' + filePath.split('/').pop(),
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
	updatePostImageUrls(postId = '', urls = []) {
		const db = wx.cloud.database();
		return new Promise((resolve, reject) => {
			db.collection('posts').doc(postId).update({
				data: {
					image_urls: urls
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