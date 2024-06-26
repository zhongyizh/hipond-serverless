// pages/detail/detail.js
import {
	ListingConditions
} from "../../models/posts.model"
const conditionIconPath = new Map([
	["全新/仅开箱", "full-pie.svg"],
	["良好/轻微使用", "75-percent-pie.svg"],
	["一般/工作良好", "50-percent-pie.svg"],
	["需修理/零件可用", "25-percent-pie.svg"]
])

Page({
	data: {
		postData: [],
		conditionForDisplay: '',
		conditionIconPath: '',
		isOwnerFlag: false,
		saveButtonUrl: "/image/not_saved_button.png",
		postSaved: false
	},
	onLoad(options) {
		const data = options.data
		// TODO: 处理特殊符号
		const postData = JSON.parse(data)
		postData.postDate = this.parseDate(postData.postDate)
		this.setData({
			postData
		})

		// 判定当前用户是不是帖子的所有者：
		this.isOwner().then(isOwner => {
			this.setData({
				isOwnerFlag: isOwner
			});
		}).catch(error => {
			this.setData({
				isOwnerFlag: false
			});
		});
		wx.cloud.callFunction({
			name: 'checkSaveStatus',
			data: {
				postId: this.data.postData._id
			},
			success: (res) => {
				if (res.result) {
					this.setData({
						postSaved: res.result,
            saveButtonUrl: "/image/saved_button.png",
            "postData.saveCount": (this.data.postData.saveCount? this.data.postData.saveCount : 0)  + 1
					})
				}
			},
			fail: (err) => {
				console.error(err);
			}
		})

		// wxml里有个本地的+1，这里去改数据库
		this.incrementViewCount()
		this.showCondition()
	},
	parseDate(date) {
		var dateObject = new Date(parseInt(date));
		// Get the Year, Month, and Day components
		const year = dateObject.getFullYear();
		const month = ('0' + (dateObject.getMonth() + 1)).slice(-2); // Adding 1 because getMonth() returns 0-indexed month
		const day = ('0' + dateObject.getDate()).slice(-2);
		return month + '/' + day + '/' + year
	},
	showCondition() {
		const condition = this.data.postData.condition
		if (condition) {
			this.setData({
				conditionForDisplay: condition.replace('/', '\n'),
				conditionIconPath: '/../../image/condition_circle/' + conditionIconPath.get(condition)
			})
		}
	},
	async incrementViewCount() {
		wx.cloud.callFunction({
			name: 'incrementViewCount',
			data: {
				postId: this.data.postData._id
			},
			success: res => {
				console.log('View count updated', res);
			},
			fail: err => {
				console.error('Failed to update view count', err);
			}
		});
	},
	onTapContact() {
		// TODO: On Hold/已售出
		const postData = this.data.postData
		const phone = postData.phone ? '手机号: ' + postData.phone : '';
		const email = postData.emailAddress ? '邮箱：' + postData.emailAddress : '';
		let contact = '';
		if (phone && email) {
			contact = phone + '\n' + email;
		} else if (phone) {
			contact = phone;
		} else if (email) {
			contact = email;
		}
		console.log('成功复制到剪贴板：' + contact)
		wx.setClipboardData({
			data: contact,
			success: function () {
				wx.showToast({
					title: '复制成功',
					icon: 'success',
					duration: 2000,
				});
			}
		})
	},
	savePost() {
		console.log(this.data.postData._id)
		if (!this.data.postSaved) {
			this.setData({
				saveButtonUrl: "/image/saved_button.png",
				postSaved: true,
				"postData.saveCount": this.data.postData.saveCount + 1

			})

			wx.cloud.callFunction({
				name: 'savePost',
				data: {
					postId: this.data.postData._id
				},
				success: function (res) {
					if (res.result) {
						wx.showToast({
							title: '收藏成功',
							icon: 'success',
							duration: 1000,
							mask: true,
						})
					}
				},
				fail: function (res) {
					console.log(res)
					wx.showToast({
						title: '收藏失败',
						icon: 'error',
						duration: 1000,
						mask: true,
					})
				}
			})

		} else {
			this.setData({
				saveButtonUrl: "/image/not_saved_button.png",
				postSaved: false,
				"postData.saveCount": this.data.postData.saveCount - 1


			})

			wx.cloud.callFunction({
				name: 'savePost',
				data: {
					postId: this.data.postData._id
				},
				success: function (res) {
					if (res.result) {
						wx.showToast({
							title: '取消收藏成功',
							icon: 'success',
							duration: 1000,
							mask: true,
						})
					}
				},
				fail: function (res) {
					wx.showToast({
						title: '取消收藏失败',
						icon: 'error',
						duration: 1000,
						mask: true,
					})
				}
			})
		}
	},
	isOwner: async function () {
		// 先获取当前帖子作者的openId
		let authorOpenId = this.data.postData._openid;
		return new Promise((resolve, reject) => {
			wx.cloud.callFunction({
				name: 'getUserInfo',
				success: function (res) {
					// 再使用云函数获取用户的openId
					let userOpenId = res.result._id;
					// 比较是不是一个人，如果是的话就说明当前用户是帖子的所有者
					console.log("detail.js: isOwner(): trynna check if current user owns the post: " + userOpenId +
						(userOpenId == authorOpenId ? " 是 " : " 不是 ") + authorOpenId);
					resolve(userOpenId == authorOpenId);
				},
				fail: function (res) {
					console.log("detail.js: isOwner(): get user info failed! ");
					reject(false);
				}
			})
		});
	},
	editPost: function () {
		console.log("detail.js: editPost(): ", this.data.postData);
		wx.navigateTo({
			url: '/pages/post/new-post-listing/new-post-listing',
			success: (res) => {
				// 发送帖子编辑event和当前详情页数据至帖子编辑页
				res.eventChannel.emit('onPageEdit', {
					fileList: this.data.postData.imageUrls.map((i) => {
						return {
							url: i,
							imageSize: 0,
							overSize: false
						}
					}),
					price: this.data.postData.price,
					condition: this.data.postData.condition || ListingConditions.UNKNOWN,
					// ddl: this.data.postData.ddl,
					body: this.data.postData.body,
					title: this.data.postData.title
				});
			}
		})
	},
	deletePost: function () {
		const db = wx.cloud.database();
		new Promise((resolve, reject) => {
				wx.showModal({
					title: "确认删除？",
					content: "删除的帖子将不可恢复",
					success: function (res) {
						resolve(res.confirm);
					}
				})
			})
			.then(isConfirmed => {
				if (!isConfirmed) return;
				wx.showLoading({
					title: '删除中...',
					mask: true
				})
				return new Promise((resolve, reject) => {
					db.collection('posts').doc(this.data.postData._id).remove({
						success: res => {
							resolve(res);
							console.log("🚮 detail.js: deletePost(): deleting post images: ", this.data.postData.imageUrls);
							wx.cloud.deleteFile({
								fileList: this.data.postData.imageUrls,
								success: res => {
									console.log("🚮 detail.js: deletePost(): successfully deleted post images: ", res.fileList);
								},
								fail: console.error
							})
							console.log("🚮 detail.js: deletePost(): successfully deleted the post: ", res.data);
							wx.hideLoading();
							wx.navigateBack();
						},
						fail: err => {
							reject(err);
						}
					})
				});
			})
	},
  // 分享给朋友
  onShareAppMessage: function() {
    const detailData = JSON.stringify(this.data.postData)
    return {
      title: this.data.postData.nickname + '发布的帖子: ' + this.data.postData.title,
      path: `/pages/detail/detail?data=${detailData}`,
      imageUrl: this.data.postData.imageUrls[0],
      success: function() {
        // 分享成功后的回调
        console.log('分享成功');
      },
      fail: function() {
        // 分享失败后的回调
        console.log('分享失败');
      }
    };
  },
  // 分享到朋友圈
  onShareTimeline: function() {
    const detailData = JSON.stringify(this.data.postData)
    return {
      title: this.data.postData.nickname + '发布的帖子: ' + this.data.postData.title,
      path: `/pages/detail/detail?data=${detailData}`,
      imageUrl: this.data.postData.imageUrls[0] 
    };
  },
})