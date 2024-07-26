// pages/detail/detail.js
import { ListingConditions } from "../../models/posts.model"
import { deletePost } from "../../services/post.service"
const conditionMapping = {
  "全新/仅开箱": "New/Open-Box",
  "良好/轻微使用": "Very Good",
  "一般/工作良好": "Good",
  "需修理/零件可用": "Fair",
  "未提供":"Unknown",
  "":"Unknown"
  };

  const labelsMap = new Map([
    ["pickup", "自取"],
    ["mail", "邮寄"],
    ["deliver", "送货"]
  ]); 
Page({
	data: {
		postData: [],
		conditionForDisplay: '',
		conditionIconPath: '',
    isOwnerFlag: false,
    showModal: false,
    tooltip: false,
    showTooltipOverlay: false,
    menuButtonTop: 0,
    menuButtonLeft: 0,
    menuButtonHeight: 0,
    menuButtonWidth: 0,
    isEditBTNEnabled: false,
    isDeleteBTNEnabled: false,
    saveButtonUrl: "/image/not_saved_button.png",
    postSaved: false,
    showDialog: false,
    conditionDescription: "",
    confirmBtn: { content: '确定', variant: 'text' },
    methodOfDeliver: "",
    
  },  
	onLoad(options) {
        // decode传进来的URL的data部分
        const data = decodeURIComponent(options.data);
        console.log('decode:', data)
		const postData = JSON.parse(data)
		postData.postDate = this.parseDate(postData.postDate)
        this.setData({ postData })
        //转换之前的成色命名方式
        if (conditionMapping.hasOwnProperty(this.data.postData.condition)) {
          this.setData({
            "postData.condition": conditionMapping[this.data.postData.condition]
          })
        }

        // 判定当前用户是不是帖子的所有者：
        this.isOwner().then(isOwner => {
            this.setData({ 
                isEditBTNEnabled: this.data.postData.isImgChecked && isOwner, 
                isDeleteBTNEnabled: isOwner 
            });
        }).catch(error => {
            this.setData({ 
                isEditBTNEnabled: false, 
                isDeleteBTNEnabled: false 
            }); 
        });
        this.setData({
          "postData.saveCount": this.data.postData.saveCount ? this.data.postData.saveCount: 0 
        })
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
            "postData.saveCount": this.data.postData.saveCount + 1
					})
				}
			},
			fail: (err) => {
				console.error(err);
			}
        });
        
		// wxml里有个本地的+1，这里去改数据库
        this.incrementViewCount()
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        this.setData({
            menuButtonTop: menuButtonInfo.top,
            menuButtonLeft: menuButtonInfo.left,
            menuButtonHeight: menuButtonInfo.height,
            menuButtonWidth: menuButtonInfo.width,
        });
        if(this.data.postData.method)
        {
          const selectedMethods = this.data.postData.method.filter(method => method).map(method => labelsMap.get(method));
          this.setData({
            methodOfDeliver: selectedMethods.join("/")
          })
        }
        else
        {
          this.setData({
            methodOfDeliver: "Unknown"
          })
        }
        
	},
	parseDate(date) {
		var dateObject = new Date(parseInt(date));
		// Get the Year, Month, and Day components
		const year = dateObject.getFullYear();
		const month = ('0' + (dateObject.getMonth() + 1)).slice(-2); // Adding 1 because getMonth() returns 0-indexed month
		const day = ('0' + dateObject.getDate()).slice(-2);
		return month + '/' + day + '/' + year
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
            success: function(){
                wx.showToast({
                    title: '联系方式已复制',  
                    icon: 'success',    
                    duration: 4000,
                });
            }
        })
    },
    conditionButton() {
      const conditionDescriptions = {
        'New/Open-Box': '该物品全新或仅开箱',
        'Exellent': '该物品功能完好，几乎没有使用痕迹和污渍',
        'Very Good': '该物品功能完好，有轻微使用痕迹或可以被清除的污渍',
        'Good': '该物品功能完好，有比较明显的使用痕迹，或较难清除掉污渍，不影响使用',
        'Fair': '该物品部分功能有故障或缺少部分部件，不影响正常使用',
      };
      const description = conditionDescriptions[this.data.postData.condition];
      if (description) {
        this.setData({
          conditionDescription: description,
          showDialog: true
        });
      }
    },

    closeDialog() {
      this.setData({ showDialog: false });
    },
    
    savePost() {
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
    isOwner: async function() {
        // 先获取当前帖子作者的openId
        let authorOpenId = this.data.postData._openid;
        return new Promise((resolve, reject) => {
            wx.cloud.callFunction({
                name: 'getUserInfo',
                success: function(res) {
                    // 再使用云函数获取用户的openId
                    let userOpenId = res.result._id;
                    // 比较是不是一个人，如果是的话就说明当前用户是帖子的所有者
                    console.log("detail.js: isOwner(): trynna check if current user owns the post: " + userOpenId + 
                                (userOpenId == authorOpenId ? " 是 " : " 不是 ") + authorOpenId);
                    resolve(userOpenId == authorOpenId);
                },
                fail: function(res) {
                    console.log("detail.js: isOwner(): get user info failed! ");
                    reject(false);
                }
            })
        });
    },
    editPost: function() {
        console.log("detail.js: editPost(): ",this.data.postData);
        wx.navigateTo({
            url: ( this.data.postData.postType === "selling" ? 
                '/pages/post/new-post-listing/new-post-listing' :
                '/pages/post/new-post/new-post'),
            success: (res)=>{
                const method = this.data.postData.method || [];
                // 发送帖子编辑event和当前详情页数据至帖子编辑页
                res.eventChannel.emit('onPageEdit',
                    {
                        _id: this.data.postData._id,
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
                        title: this.data.postData.title,
                        originalPrice: this.data.postData.originalPrice,
                        isDeliverChecked: method[0] == "deliver",
                        isMailChecked: method[1] == "mail",
                        isPickupChecked: method[2] == "pickup"

                        
                    }
                );
            }
        })
    },
    onDeletePostBTNClicked: function() { 
        new Promise((resolve, reject) => {
            wx.showModal({
                title: "确认删除？",
                content: "删除的帖子将不可恢复",
                success: function(res) {
                    resolve(res.confirm);
                }
            })
        }).then(isConfirmed => {
            if (!isConfirmed) return;
            wx.showLoading({
                title: '删除中...',
                mask: true
            })
            deletePost(this.data.postData._id, this.data.postData.imageUrls).then(() => {
                wx.hideLoading();
                wx.navigateBack();
            }); 
        });
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

    showShareOptions: function() {
        this.setData({
            showModal: true
        });
    },

    hideShareOptions: function() {
        this.setData({
            showModal: false
        });
    },

    showTooltip: function() {
        this.setData({
            tooltip: true,
            showTooltipOverlay: true
        });
    },

    hideTooltip: function() {
        this.setData({
            tooltip: false,
            showTooltipOverlay: false
        });
    },

    hideTooltipAndShowShareOptions: function() {
        this.setData({
            tooltip: false,
            showTooltipOverlay: false,
            showModal: true
        });
    }
})