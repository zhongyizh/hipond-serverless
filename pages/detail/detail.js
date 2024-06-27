// pages/detail/detail.js
import { ListingConditions } from "../../models/posts.model"
import { deletePost } from "../../services/post.service"
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
        isEditBTNEnabled: false,
        isDeleteBTNEnabled: false
    },
	onLoad(options) {
		const data = options.data
		// TODO: 处理特殊符号
		const postData = JSON.parse(data)
		postData.postDate = this.parseDate(postData.postDate)
        this.setData({ postData })
        
        // 判定当前用户是不是帖子的所有者：
        console.log("isImgChecked: ", this.data.postData.isImgChecked);
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
        wx.cloud.callFunction ({
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
					title: '复制成功',  
					icon: 'success',    
					duration: 2000,
				});
			}
		})
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
                        title: this.data.postData.title
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
    } 
})