// pages/post/new-post/new-post.js
import { getPostTitleFromBody } from '../../../utils/util'
import { msgSecCheck } from '../../../services/security.service'
import { createPost, editPost } from "../../../services/post.service"
import { ListingConditions } from '../../../models/posts.model';

const errMsg = new Map([
	["text", "标题不能为空"],
	["body", "需要文章正文"],
	["image", "请选至少一张图"]
]);

Page({
	data: {
		// Data Models
		fileList: [],
		title: '',
		body: '',
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
		isFromEdit: false
    },
    onLoad() {
        // 发帖编辑功能的实现
        // 通过一个event来从「详情页」传数据到「编辑页」：
        // 获取所有打开的EventChannel事件
        const eventChannel = this.getOpenerEventChannel();
        // 监听 index页面定义的 toB 事件
        eventChannel.on('onPageEdit', (res) => {
			this.setData(res);
			this.setData({ originalCopy: JSON.parse(JSON.stringify(res)) }); 
			this.setData({ isFromEdit: true });
            console.log("new-post.js: onLoad(): onPageEdit triggered: this.data:", this.data);
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
	inputText: function(res) {
		const widgetId = res.currentTarget.id;
		try {
			this.data[widgetId] = res.detail.value;
		}
		catch {
			console.log("❌ new-post-listing: upload(): Unrecognized Input Box id");
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
			'price': 0.00,
			'location': '',
			'condition': ListingConditions.UNKNOWN,
			'postDate': Date.now(),
			'postType': 'life',
			'isImgChecked': false,
			'viewCount': 0
		}
		var images = this.data.fileList
		if (!this.validateForm([payload, images])) return false
		
		wx.showLoading({
			title: '上传中...',
			mask: true
		})
		
		try {
			// 先审核文字部分
			const isTitleChecked = await msgSecCheck(payload.title)
			const isBodyChecked = await msgSecCheck(payload.body)
			if (!isBodyChecked || !isTitleChecked) {
				wx.showToast({
					title: '内容含违规信息',
					icon: 'error',
					duration: 2000
				})
				return false
			}
			else console.log("✅ new-post.js: upload(): Text Content Check Passed!");
	
			// 注意：Image Picker传的参数都是object, 所以要先把Url从Object里面提取出来，变成字符串格式
			payload.imageUrls = images.map((i) => i.url);
			// 根据是否是编辑的旧帖子来调用不同函数，发新帖createPost()，编辑旧帖editPost()
			if (!this.data.isFromEdit) {
				await createPost(payload);
			}
			else {
				payload._id = this.data.originalCopy._id;
				await editPost(payload);
			}
	
			wx.hideLoading();
			wx.navigateBack();
		} catch (error) {
			console.error("Upload failed: ", error);
			wx.hideLoading();
			wx.showToast({
				title: '上传失败',
				icon: 'error',
				duration: 2000
			});
		}
	}
})