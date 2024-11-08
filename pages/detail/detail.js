// pages/detail/detail.js
import { ListingConditions } from "../../models/posts.model"
import { deletePost, createComment, deleteComment } from "../../services/post.service"
import { getComments, getReplies, throttle } from "../../utils/util"
import { msgSecCheck } from '../../services/security.service'

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
        saveButtonUrl: "/image/not_saved_button.svg",
        postSaved: false,
        showDialog: false,
        conditionDescription: "",
        confirmBtn: { content: '确定', variant: 'text' },
        methodOfDeliver: "",
        currentuserid: "",
        comments: [],
        showInput: false,
        parent: null,
        inputContent: '',
        replyToCmt: null, // stores comment ID when replying
        replyToUser: null,
        inputPlaceholder: "说点什么...",
        inputValue: '',
        prefix: '',
        offset: 0,
        currentPostsCount: 0,
        pageurl: "",
        commentCounts: 0,
        keyboardHeight: 0
    },

	onLoad(options) {
        // decode传进来的URL的data部分
        const data = decodeURIComponent(options.data)
        this.setData({
            pageurl: '/pages/detail/detail?data=' + options.data,
        })
		const postData = JSON.parse(data)
		postData.postDate = this.parseDate(postData.postDate)
        this.setData({ postData })
        // 加载评论
        this.displayComments()
        // 判定当前用户是不是帖子的所有者：
        this.checkOwnership()
        // 转换之前的成色命名方式
        if (conditionMapping.hasOwnProperty(this.data.postData.condition)) {
            this.setData({
                "postData.condition": conditionMapping[this.data.postData.condition]
            })
        }
        this.countComments(postData._id)
        // 加载收藏数量
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
                        saveButtonUrl: "/image/saved_button.svg",
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
        wx.onKeyboardHeightChange(res => {
            if (res.height > 0) {
                this.setData({
                    keyboardHeight: res.height
                });
            } else {
                // 键盘收起时重置高度
                this.setData({
                    keyboardHeight: 0
                });
            }
        });
        
	},
	parseDate(date) {
		var dateObject = new Date(parseInt(date));
		// Get the Year, Month, and Day components
		const year = dateObject.getFullYear();
		const month = ('0' + (dateObject.getMonth() + 1)).slice(-2); // Adding 1 because getMonth() returns 0-indexed month
        const day = ('0' + dateObject.getDate()).slice(-2);
        const hour = ('0' + dateObject.getHours()).slice(-2);
        const miniute = ('0' + dateObject.getMinutes()).slice(-2);
		return month + '/' + day + '/' + year + ' ' + hour + ':' + miniute
    },
    onReachBottom() {
		this.displayComments()
	},
    async checkOwnership() {
        try {
            const { isOwner, userOpenId } = await this.isOwner();
            this.setData({
                isEditBTNEnabled: this.data.postData.isImgChecked && isOwner,
                isDeleteBTNEnabled: isOwner,
                currentUserOpenId: userOpenId
            });
            console.log("Is Owner: ", isOwner, " User ID: ", userOpenId);
        } catch (error) {
            console.error("Error in checking ownership: ", error);
            this.setData({
                isEditBTNEnabled: false,
                isDeleteBTNEnabled: false
            });
        }
    },
    async displayComments() {
        const db = wx.cloud.database()
		const countResult = await db.collection('comments').where({
            postId: this.data.postData._id,
            parent: "Post"
		}).count()
		const total = countResult.total
        const isEnd = this.data.offset >= total
        const loadlimit = 20
		if (!isEnd) {
			const postComments = await getComments(this.data.postData._id, loadlimit, this.data.offset)
			const currentLength = postComments.length
            const newOffset = this.data.offset + currentLength
            const commentsWithReplyOffset = postComments.map(comment => ({
                ...comment,
                replies: [],
                replyOffset: 0,
                showReplies: false,
                formatDate: this.parseDate(comment.postDate)
            }));
			this.setData({
				comments: [...this.data.comments, ...commentsWithReplyOffset],
				offset: newOffset
			})
		}
    },
    async displayReplies(event) {
        const db = wx.cloud.database()
        const commentIndex = event.currentTarget.dataset.index;
        const cmtId = event.currentTarget.dataset.commentid;
        const cmtrId = event.currentTarget.dataset.userid;
        const currentComment = this.data.comments[commentIndex]

        if (currentComment.isLoadingReplies) {
            console.log(`Comment ${cmtId} is already loading replies`);
            return;
        }
        let updatedComments = JSON.parse(JSON.stringify(this.data.comments));
        updatedComments[commentIndex].isLoadingReplies = true;
        this.setData({
            comments: updatedComments
        });
    
        try {
            const countResult = await db.collection('comments').where({
                postId: this.data.postData._id,
                parent: cmtId
            }).count();
            const total = countResult.total;
            const isEnd = currentComment.replyOffset >= total;
            const loadlimit = 5;
    
            if (!isEnd) {
                const postReplies = await getReplies(cmtId, cmtrId, loadlimit, currentComment.replyOffset);
                const currentLength = postReplies.length;
                const newOffset = currentComment.replyOffset + currentLength;
                const replies = postReplies.map(reply => ({
                    ...reply,
                    formatDate: this.parseDate(reply.postDate)
                }));
    
                // Update the comment's replies and offset
                updatedComments = JSON.parse(JSON.stringify(this.data.comments));
                updatedComments[commentIndex] = {
                    ...updatedComments[commentIndex],
                    replies: [...updatedComments[commentIndex].replies, ...replies],
                    replyOffset: newOffset,
                    showReplies: true,
                    isLoadingReplies: false // Stop loading
                };
            } else {
                updatedComments[commentIndex].isLoadingReplies = false; // No more replies to load
            }
            this.setData({
                comments: updatedComments
            });
        } catch (error) {
            console.error('Error fetching replies:', error);
            // Reset loading state in case of error
            updatedComments[commentIndex].isLoadingReplies = false;
            this.setData({
                comments: updatedComments
            });
        }
    },
    countComments: function(postId) {
        wx.cloud.callFunction({
            name: 'checkCommentCounts',
            data: {
                postId: postId
            },
            success: res => {
                if (res.result && res.result.success) {
                    // Store the count in appData
                    const totalCount = res.result.count;
                    this.setData({
                        commentCounts: totalCount
                    });
            
                    console.log('Total count of comments and replies saved to appData:', totalCount);
                } else {
                    console.error('Error retrieving count from cloud function:', res);
                }
            },
            fail: err => {
                console.error('Failed to call cloud function:', err);
            }
        });
    },
    closeReplies: function(event) {
        const commentIndex = event.currentTarget.dataset.index
        const updatedComments = this.data.comments
        updatedComments[commentIndex] = {
            ...this.data.comments[commentIndex],
            replies: [],
            replyOffset: 0,
            showReplies: false
        };
        this.setData({
            comments: updatedComments
        });
    },
    onInput: function(event) {
        this.setData({
          inputValue: event.detail.value
        });
    },
    async upload() {
		var payload = {
            'parent': this.data.parent ? this.data.parent: "Post",
            '_tgtCmtId': this.data.replyToCmt ? this.data.replyToCmt: "Post",
            '_tgtId': this.data.replyToUser ? this.data.replyToUser: "Author",
			'body': this.data.inputValue,
			'location': '',
			'postDate': Date.now(),
			'postId': this.data.postData._id,
            'isImgChecked': false,
            'repliesCount': 0,
            'likeCount': 0
		}
		
		wx.showLoading({
			title: '上传中...',
			mask: true
		})
		// 返回帖子界面
        this.hideReplyOptions()
		
		try {
			// 审核文字部分
			const isBodyChecked = await msgSecCheck(payload.body)
			if (!isBodyChecked) {
				wx.showToast({
					title: '内容含违规信息',
					icon: 'error',
					duration: 2000
				})
				return false
			}
			else console.log("✅ detail.js: upload(): Text Content Check Passed!");
            
			// 发布评论
			await createComment(payload);
			
			wx.showToast({
				title: '评论成功',
				icon: 'success',
				duration: 3000
			});
		} catch (error) {
			console.error("Upload failed: ", error);
			wx.hideLoading();
			wx.showToast({
				title: '评论失败',
				icon: 'error',
				duration: 2000
			});
		} finally {
            wx.hideLoading(); // 最后隐藏indicator
            wx.reLaunch({
                url: this.data.pageurl
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
    likeComment: function(e) {
		const commentId = e.currentTarget.dataset.commentid;
        const isLiked = e.currentTarget.dataset.liked;
        const currentLikes = e.currentTarget.dataset.likes;

        // Find the index of the comment in the comments array
        const commentIndex = this.data.comments.findIndex(item => item._id === commentId);
        console.log(commentIndex)
        if (commentIndex !== -1) {
            let updatedComments = [...this.data.comments];
            let newLikeCount = isLiked ? currentLikes - 1 : currentLikes + 1;  // Update likes count
            // Toggle the like image status and update the like count
            updatedComments[commentIndex].isLiked = !isLiked;
            updatedComments[commentIndex].likeCount = newLikeCount;
            if (updatedComments[commentIndex].isLiked) {
				updatedComments[commentIndex].likeButtonUrl = "/image/liked_button.svg"
			} else {
				updatedComments[commentIndex].likeButtonUrl = "/image/not_liked_button.svg"
			}

            // Update the UI
            this.setData({
                comments: updatedComments
            });

            // Call a backend function to update the like count in the database
            this.updateLikesOnServer(commentId);
        } else {
            console.error("Cannot find target comment")
        }
    },
    likeReply: function(e) {
		const commentId = e.currentTarget.dataset.commentid;
        const isLiked = e.currentTarget.dataset.liked;
        const currentLikes = e.currentTarget.dataset.likes;
        const parentId = e.currentTarget.dataset.parent;

        // Find the index of the comment in the comments array
        const parentIndex = this.data.comments.findIndex(item => item._id === parentId);
        // const commentIndex = this.data.comments.replies.findIndex(item => item._id === commentId);
        console.log(parentIndex)
        if (parentIndex !== -1) {
            const commentIndex = this.data.comments[parentIndex].replies.findIndex(item => item._id === commentId);
            if (commentIndex !== -1) {
                let updatedComments = [...this.data.comments];
                let newLikeCount = isLiked ? currentLikes - 1 : currentLikes + 1;  // Update likes count
                // Toggle the like image status and update the like count
                updatedComments[parentIndex].replies[commentIndex].isLiked = !isLiked;
                updatedComments[parentIndex].replies[commentIndex].likeCount = newLikeCount;
                if (updatedComments[parentIndex].replies[commentIndex].isLiked) {
                    updatedComments[parentIndex].replies[commentIndex].likeButtonUrl = "/image/liked_button.svg"
                } else {
                    updatedComments[parentIndex].replies[commentIndex].likeButtonUrl = "/image/not_liked_button.svg"
                }
                // Update the UI
                this.setData({
                    comments: updatedComments
                });
                // Call a backend function to update the like count in the database
                this.updateLikesOnServer(commentId);
            } else {
                console.error("Cannot find target comment")
            }
        } else {
            console.error("Cannot find target comment")
        }
    },
    updateLikesOnServer: function(commentId) {
        // Call the cloud function to update the like status and like count in the database
        wx.cloud.callFunction({
          name: 'likeComment',  // The name of your cloud function
          data: {
            commentId: commentId  // Pass the comment ID to the cloud function
          },
          success: res => {
            console.log('Like status updated successfully:', res);
          },
          fail: err => {
            console.error('Failed to update like status:', err);
          }
        });
    },
    onTapContact() {
        // TODO: On Hold/已售出
        const postData = this.data.postData
        const phone = postData.phone ? '手机号: ' + postData.phone : '';
        const email = postData.emailAddress ? '邮箱：' + postData.emailAddress : '';
        const other = postData.otherContact ? '其他联系方式: ' + postData.otherContact: "";
        let contact = '';
        if(!this.data.postData.isOtherContactChecked)
        {
        if (this.data.postData.isPhoneChecked && this.data.postData.isEmailChecked) {
            contact = phone + '\n' + email;
        } else if (this.data.postData.isPhoneChecked) {
            contact = phone;
        } else if (this.data.postData.isEmailChecked) {
            contact = email;
        }
        }
        else
        {
            if (this.data.postData.isPhoneChecked && this.data.postData.isEmailChecked) {
                contact = other + '\n' + phone + '\n' + email;
            } else if (this.data.postData.isPhoneChecked) {
                contact =  other + '\n' + phone;
            } else if (this.data.postData.isEmailChecked) {
                contact =  other + '\n' + email;
            }
            else
            {
                contact = other
            }
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
				saveButtonUrl: "/image/saved_button.svg",
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
				saveButtonUrl: "/image/not_saved_button.svg",
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
        try {
            const res = await wx.cloud.callFunction({
                name: 'getUserInfo',
            });
            let userOpenId = res.result._id;
            console.log("Current User: ", userOpenId, " Post Author: ", authorOpenId);
            // Compare the userOpenId and authorOpenId and return the userOpenId for further use
            return {
                isOwner: userOpenId == authorOpenId,
                userOpenId: userOpenId
            };
        } catch (error) {
            console.error("Failed to get user info: ", error);
            return {
                isOwner: false,
                userOpenId: null
            };
        }
        
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
                wx.reLaunch({
                    url: '/pages/tab-bar/index/index',
                });
                wx.showToast({
                    title: '已删除',
                    icon: 'success',
                    duration: 3000
                });
            }); 
        });
    },
    onDeleteCmt: function(event) { 
        const commentId = event.currentTarget.dataset.commentid;
        const parent = event.currentTarget.dataset.parent;
        new Promise((resolve, reject) => {
            wx.showModal({
                title: "确认删除？",
                content: "删除的评论将不可恢复",
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
            deleteComment(commentId, parent).then(() => {
                wx.hideLoading();
                wx.showToast({
                    title: '已删除',
                    icon: 'success',
                    duration: 3000
                });
                wx.reLaunch({
                    url: this.data.pageurl
                })
            }); 
        });
    },
    // 分享给朋友
    onShareAppMessage: function() {
        const detailData = JSON.stringify(this.data.postData)
        var priceIndicator = ''
        if (this.data.postData.postType == "selling") {
            priceIndicator = '[$' + this.data.postData.price + ']'
        } else {
            priceIndicator = ''
        }
        return {
            title: priceIndicator + ' ' + this.data.postData.title,
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
        var priceIndicator = ''
        if (this.data.postData.postType == "selling") {
            priceIndicator = '[$' + this.data.postData.price + ']'
        } else {
            priceIndicator = ''
        }
        return {
            title: priceIndicator + ' ' + this.data.postData.title,
            path: `/pages/detail/detail?data=${detailData}`,
            imageUrl: this.data.postData.imageUrls[0] 
        };
    },

    showReplyOptions: function(event) {
        const rawparent = event.currentTarget.dataset.parent
        var parent = null
        const commentId = event.currentTarget.dataset.commentid
        const userId = event.currentTarget.dataset.userid
        const nickname = event.currentTarget.dataset.nickname
        if (rawparent == "Post") {
            parent = commentId
        } else {
            parent = rawparent
        }
        this.setData({
            showInput: true,
            parent: parent ? parent : null,
            replyToCmt: commentId ? commentId : null,
            replyToUser: userId ? userId : null,
            inputPlaceholder: nickname ? `@${nickname}` : '说点什么...', // Update placeholder
            prefix: nickname ? `@${nickname} ` : ''
        });
    },

    hideReplyOptions: function(event) {
        wx.hideKeyboard();
        this.setData({
            showInput: false,
            parent: null,
            replyToCmt: null,
            replyToUser: null,
            inputPlaceholder: '说点什么...',
            prefix: ''
        });
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
    },

    onBack: function() {
        wx.navigateBack();
    },

    onGoHome: function() {
        wx.reLaunch({
            url: '/pages/tab-bar/index/index',
        });
    },
})