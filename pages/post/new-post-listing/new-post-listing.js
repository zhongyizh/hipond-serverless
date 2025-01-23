// pages/post/new-post-listing/new-post-listing.js
import {
	getPostTitleFromBody
} from '../../../utils/util'
import {
	msgSecCheck
} from '../../../services/security.service'
import {
	createPost,
	editPost
} from "../../../services/post.service"
import ActionSheet, {
	ActionSheetTheme
} from 'tdesign-miniprogram/action-sheet/index';


const errMsg = new Map([
	["price", "请输入价格"],
	["image", "请选至少一张图"],
	["title", "请输入标题"]
	// ["method", "请选择交易方式"],
	// ["condition", "请选择新旧程度"]
]);

Page({
	data: {
		// Data Models
		confirmBtn: {
			content: '知道了(3s)',
			variant: 'text'
		},
		showConditionExp: false,
		confirmBtnDisabled: true,
		fileList: [],
		condition: '',
		title: '',
		body: '',
		price: '',
		// View Models
		originalCopy: {}, // Store the copy of the original post upon editing.
		gridConfig: {
			column: 9,
			width: 200,
			height: 200,
		},
		sizeLimit: {
			size: 5,
			unit: 'MB',
			message: '图片大小不超过5MB'
		},
		isFromEdit: false,
		postLocation: ""
	},
	async onLoad() {
		// await wx.cloud.callFunction({
		// 	name: 'newUserCheck',
		// 	data: {},
		// 	success: res => {
		// 		if (res.result) {
		// 			console.log("This is a new user.", res)

		// 			this.setData({
		// 				showActSheet: true,
		// 			})
		// 			setTimeout(() => {
		// 				this.setData({
		// 					confirmBtnDisabled: false
		// 				});
		// 			}, 3000);
		// 		} else {
		// 			console.log("This is an old user.", res)
		// 		}
		// 	},
		// 	fail: err => {
		// 		console.error('Failed to check if the user is new user:', err);
		// 	}
		// });
		// 发帖编辑功能的实现
		// 通过一个event来从「详情页」传数据到「编辑页」：
		// 获取所有打开的EventChannel事件
		const eventChannel = this.getOpenerEventChannel();
		// 监听 index页面定义的 toB 事件
		eventChannel.on('onPageEdit', (res) => {
			this.setData(res);
			this.setData({
				originalCopy: JSON.parse(JSON.stringify(res))
			});
			this.setData({
				isFromEdit: true
			});
			console.log("new-post-listing.js: onLoad(): onPageEdit triggered: this.data:", this.data);
		})
	},
	// onConfirm() {
	// 	// 如果按钮仍然禁用，则直接返回
	// 	if (this.data.confirmBtnDisabled) {
	// 		return;
	// 	}
	// 	this.setData({
	// 		showActSheet: false
	// 	});
	// },
	handleAdd(e) {
		const {
			fileList
		} = this.data;
		const {
			files
		} = e.detail;
		// 选择完所有图片之后，统一上传，因此选择完就直接展示
		this.setData({
			fileList: [...fileList, ...files], // 此时设置了 fileList 之后才会展示选择的图片
		});
	},
	handleRemove(e) {
		const {
			index
		} = e.detail;
		const {
			fileList
		} = this.data;
		fileList.splice(index, 1);
		this.setData({
			fileList,
		});
	},

	onChangeDeliver(e) {
		this.setData({
			DeliverIndex: e.detail.value
		});
	},
	onTapCondition(e) {
		ActionSheet.show({
			theme: ActionSheetTheme.List,
			selector: '#t-action-sheet',
			context: this,
			align: 'center',
			description: '新旧程度',
			items: [{
					label: '全新',
					suffixIcon: 'none'
				},
				{
					label: '几乎全新',
					suffixIcon: 'none'
				},
				{
					label: '轻微使用痕迹',
					suffixIcon: 'none'
				},
				{
					label: '明显使用痕迹',
					suffixIcon: 'none'
				},
			],
		});
	},
	handleSelected(e) {
		this.setData({
			condition: e.detail.selected.label
		})
	},
	inputText: function (res) {
		const widgetId = res.currentTarget.id;
		try {
			this.setData({
				[widgetId]: res.detail.value,
			});
		} catch {
			console.log("❌ new-post-listing: upload(): Unrecognized Input Box id");
		}
	},

	// 聚焦时显示字数统计
	showCounter: function () {
		this.setData({
			showCounter: true,
		});
	},

	// 失焦时隐藏字数统计
	hideCounter: function () {
		this.setData({
			showCounter: false,
		});
	},

	showIndicator: function () {
		this.setData({
			showIndicator: true,
		});
	},

	// 失焦时隐藏 indicator
	hideIndicator: function () {
		this.setData({
			showIndicator: false,
		});
	},

	validateForm: function (payloads) {
		const missingFields = []; // 存储缺少的字段

		// 检查第一个对象中的字段
		for (const [key, value] of Object.entries(payloads[0])) {
			if (errMsg.has(key) && value === "") {
				missingFields.push(errMsg.get(key));
			}
		}

		// 检查第二个对象（如图片列表）
		if (payloads[1].length <= 0) {
			missingFields.push(errMsg.get("image"));
		}

		// 如果有缺少的字段
		if (missingFields.length > 0) {
			const message = `${missingFields.join("、")}，即可发布哦~`; // 动态拼接提示语
			wx.showToast({
				title: message,
				icon: 'none',
				duration: 2000
			});
			return false;
		}

		return true;
	},

	chooseLocation() {
		var that = this
		wx.choosePoi({
			success(res) {
				var address = res.address
				const result = address.split(",")
				if (result[result.length - 2].includes("-")) {
					result[result.length - 2] = result[result.length - 2].split("-")[0];
				}
				const modifiedAddress = result.slice(1, -1).join(",").trim();
				that.setData({
					postLocation: modifiedAddress ? modifiedAddress : ""
				})
			},
			fail(res) {
				console.log(res)
			},
			complete(res) {}
		})
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
			// TODO: 编辑贴子后viewCount会清零
			'viewCount': 0,
			'postLocation': this.data.postLocation,
			'method': [this.data.DeliverIndex ? '' : 'deliver', '', this.data.DeliverIndex ? 'pickup' : '']
			//为保持数据库原有['deliver','mail','pickup']格式
		}
		var images = this.data.fileList
		if (!this.validateForm([payload, images])) return false

		wx.showLoading({
			title: '上传中...',
			mask: true
		})

		wx.reLaunch({
			url: '/pages/tab-bar/index/index',
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
			} else console.log("✅ new-post-listing.js: upload(): Text Content Check Passed!");

			// 注意：Image Picker传的参数都是object, 所以要先把Url从Object里面提取出来，变成字符串格式
			payload.imageUrls = images.map((i) => i.url);
			// 根据是否是编辑的旧帖子来调用不同函数，发新帖createPost()，编辑旧帖editPost()
			if (!this.data.isFromEdit) {
				await createPost(payload);
			} else {
				payload._id = this.data.originalCopy._id;
				await editPost(payload);
			}
			wx.showToast({
				title: '上传成功',
				icon: 'success',
				duration: 3000
			});
		} catch (error) {
			console.error("Upload failed: ", error);
			wx.hideLoading();
			wx.showToast({
				title: '上传失败',
				icon: 'error',
				duration: 2000
			});
		} finally {
			wx.hideLoading(); // 最后隐藏indicator
		}
	}
})