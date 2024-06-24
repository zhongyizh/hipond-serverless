// pages/post/new-post-listing/new-post-listing.js
import { getPostTitleFromBody, uploadImage } from '../../../utils/util'
import { msgSecCheck, imgSecCheck } from '../../../services/security.service'
import { deletePost } from "../../../services/post.service"

const errMsg = new Map([
	["text", "标题不能为空"],
	["body", "需要物品描述"],
	["price", "请输入价格"],
	["image", "请选至少一张图"]
]);

Page({
	data: {
		// Data Models
		fileList: [],
		condition: '全新/仅开箱',
		title: '',
		body: '',
		price: '',
		// View Models
		originalCopy: {}, // Store the copy of the original post upon editing.
		gridConfig: {
            column: 9,
            width: 213,
            height: 213,
		},
		sizeLimit: {
			size: 5,
			unit: 'MB',
			message: '图片大小不超过5MB'
		},
		actionSheetItems: ['全新/仅开箱', '良好/轻微使用', '一般/工作良好', '需修理/零件可用'],
		isActionSheetHidden: true,
    },
    onLoad() {
        // 发帖编辑功能的实现
        // 通过一个event来从「详情页」传数据到「编辑页」：
        // 获取所有打开的EventChannel事件
        const eventChannel = this.getOpenerEventChannel();
        // 监听 index页面定义的 toB 事件
        eventChannel.on('onPageEdit', (res) => {
			this.setData(res);
			this.setData({ originalCopy: JSON.parse(JSON.stringify(res))}); 
            console.log("new-post-listing.js: onLoad(): onPageEdit triggered: this.data:", this.data);
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
				this.data.price = res.detail.value; //TODO: 确认价格的输入限制，而且现在必须输入价格
				break;
			case "title":
				this.data.title = res.detail.value;
				break;
			default: 
				console.log("Unrecognized Input Box id");
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
			'title': this.data.title ? this.data.title : getPostTitleFromBody(this.data.body),
			'body': this.data.body,
			'price': this.data.price,
			'location': '',
			'condition': this.data.condition,
			'postDate': Date.now(),
			'postType': 'selling',
			'isImgChecked': false,
			'viewCount': 0
		}
		var images = this.data.fileList
		if (!this.validateForm([payload, images])) return false

		wx.showLoading({
			title: '上传中...',
			mask: true
		})

		const isBodyChecked = await msgSecCheck(payload.body)
		const isTitleChecked = await msgSecCheck(payload.title)
		if (!isBodyChecked || !isTitleChecked) {
			wx.showToast({
				title: '内容含违规信息',
				icon: 'error',
				duration: 2000
			})
			return false
		}
		else console.log("✅ new-post-listing.js: upload(): Text Content Check Passed!");

		// 先去add Post的内容，数据库随机给一个id
		// 如果是通过编辑按钮进来的就用旧postId
		let result = await this.uploadPostData(payload);
		const postId = result._id;
		// 获取原始文件列表和当前文件列表
		// 如果不是通过“编辑”按钮进来的就把originalFileList初始化成空数组
		const originalFileList = this.data.originalCopy.fileList ?? [];    // Denote as A
		const currentFileList = this.data.fileList; 					   // Denote as B
		console.log("new-post-listing.js: upload(): optimized editing action: ");
		console.log("new-post-listing.js: upload(): original imgs: ", originalFileList, " cur imgs: ", currentFileList);
		// 计算要添加的文件 (B - (A ∩ B))
		const filesToAdd = currentFileList.filter(
			img => !originalFileList.some(originalImg => originalImg.url === img.url)
		);
		// 计算要删除的文件 (A - (A ∩ B))
		const filesToDelete = originalFileList.filter(
			originalImg => !currentFileList.some(img => img.url === originalImg.url)
		).map(img => img.url);
        console.log("new-post-listing.js: upload(): images to add: ", filesToAdd);
        console.log("new-post-listing.js: upload(): images to clear: ", filesToDelete);
		// 上传新的图片并检查
		let imageUrls = originalFileList.filter(
			img => !filesToDelete.some(fileToDelete => img.url === fileToDelete.url)
		).map(img => img.url);
		for (let img of filesToAdd) {
			const fileId = await uploadImage(postId, img.url)
			imageUrls.push(fileId);
			let traceId = await imgSecCheck(postId, fileId);
			console.log("Image Security Compliance Check TraceId for " + fileId + " is " + traceId);
		}
		// 最后再去update对应的Post的imageUrls
		console.warn(imageUrls);
		result = await this.updatePostImageUrls(postId, imageUrls);
		// 删除不再使用的图片
		deletePost(this.data.originalCopy._id, filesToDelete)
		wx.hideLoading();
		wx.navigateBack();
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
	},
})