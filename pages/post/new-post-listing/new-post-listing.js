// pages/post/new-post-listing/new-post-listing.js
import { getPostTitleFromBody } from '../../../utils/util'
import { msgSecCheck } from '../../../services/security.service'
import { createPost, editPost } from "../../../services/post.service"

const errMsg = new Map([
	["body", "需要物品描述"],
	["price", "请输入价格"],
  ["image", "请选至少一张图"],
  ["method", "请选择交易方式"],
  ["condition", "请选择新旧程度"]
]);

Page({
	data: {
		// Data Models
		fileList: [],
		condition: '物品新旧程度*',
		title: '',
		body: '',
    price: '',
    originalPrice: '',
		// View Models
		originalCopy: {}, // Store the copy of the original post upon editing.
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
		actionSheetItems: ['全新/仅开箱', '良好/轻微使用', '一般/工作良好', '需修理/零件可用'],
    isFromEdit: false,
    isDeliverChecked: false,
    isPickupChecked: false,
    isMailChecked: false,
    subitButtonType: 'submit-button'
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
			this.setData({ isFromEdit: true });
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
  showActionSheet(e) {
    wx.showActionSheet({
      itemList: this.data.actionSheetItems,
      success: (res) =>{
        if(!res.camcle){    
          this.setData({
            condition: this.data.actionSheetItems[res.tapIndex]
          })
        }else{
          console.log("Condition selection cancle")
        }
      },
      fail: (res) =>{
        console.log("fail")
        console.log(res)
      },
      complete: (res) => {
        console.log("Condition selection complete")
      }
    })
  },
  
  checkboxChange: function (e) {
		const items = e.detail.value;
		const isChecked = (id) => items.includes(id);
		const isDeliverChecked = isChecked("deliver");
    const isPickupChecked = isChecked("pickup");
    const isMailChecked = isChecked("mail");
		this.setData({
			isDeliverChecked: isDeliverChecked,
      isPickupChecked: isPickupChecked,
      isMailChecked: isMailChecked
		});
    // this.updateButtonStatus();
  },
  // updateButtonStatus()
  // {

  // },
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
			'price': this.data.price,
      'location': '',
			'condition': this.data.condition !== '物品新旧程度*' ? this.data.condition : '',
			'postDate': Date.now(),
			'postType': 'selling',
			'isImgChecked': false,
      'viewCount': 0,
      'originalPrice': this.data.originalPrice,
      'method': !this.data.isDeliverChecked && !this.data.isMailChecked && !this.data.isPickupChecked ? "" : 
      [
        this.data.isDeliverChecked ? 'deliver' : '', 
        this.data.isMailChecked ? 'mail' : '', 
        this.data.isPickupChecked ? 'pickup' : ''
        ]
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
			else console.log("✅ new-post-listing.js: upload(): Text Content Check Passed!");
	
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