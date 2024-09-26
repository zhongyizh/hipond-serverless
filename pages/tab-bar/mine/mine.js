// pages/tab-bar/mine/mine.js
import { getMyUserInfo } from '../../../utils/util'
var zipCodeInfo = require('../../../utils/zipcode.js');

Page({
	data: {
		currentTabbarIndex: 3,
		currentTagIndex: 0,
		tags: [{
			text: "动态",
			count: 0
		}, {
			text: "在售",
			count: 0
		}, {
			text: "收藏",
			count: 0
		}],
		userInfo: {},
		posts: [],
		maxLimit: 20,
    	offsetLife: 0,
		offsetSelling: 0,
		offsetSaving: 0,
		savedIdList: [],
		savedPost: [],
		geoInfo: ""
	},
	async onLoad() {
    	if(typeof this.getTabBar === 'function' && this.getTabBar()) {
			this.getTabBar().setData({
				selected: this.data.currentTabbarIndex
			})
		}
	},
	async onShow() {
		await this.getMyProfile()
		await this.getTagsCount()
		this.getRelevantPosts()
	},
	async onReachBottom() {
		this.getRelevantPosts()
	},
	select: function(t) {
		var index = t.target.dataset.index; // Get the index of the tapped item
		if (index !== undefined && index !== this.data.currentTagIndex) {
			this.setData({
				currentTagIndex: index, // Update the current item to control active class
			})
			this.getRelevantPosts()
		}
	},
	getRelevantPosts() {
		if (this.data.posts.length > this.data.tags[0].count + this.data.tags[1].count) {
			this.setData({
				posts: [],
				offsetLife: 0,
				offsetSelling: 0
			})
		}
		switch(this.data.currentTagIndex) {
			case 0: // 动态页面
				this.getLife()
				break;
			case 1: // 在售页面
          		this.getSelling()
				break;
      		case 2: // 收藏页面
				this.getMySaves()
          		break;
			default:
				console.log("Invalid current tag index")
		}
	},
	async getLife() {
		// 判断是否加载完成
		const isEnd = this.data.offsetLife >= this.data.tags[0].count
		if (!isEnd) {
			const postData = await this.getUserPostData(this.data.maxLimit, this.data.offsetLife, ['life'])
			const currentLength = postData.length
			const newOffset = this.data.offsetLife + currentLength
			this.setData({
				posts: [...this.data.posts, ...postData],
				offsetLife: newOffset
			})
		}
	},
  	async getSelling() {
		const isEnd = this.data.offsetSelling >= this.data.tags[1].count
		if (!isEnd) {
			const postData = await this.getUserPostData(this.data.maxLimit, this.data.offsetSelling, ['selling'])
			const currentLength = postData.length
			const newOffset = this.data.offsetSelling + currentLength
			this.setData({
				posts: [...this.data.posts, ...postData],
				offsetSelling: newOffset
			})
		}
	},
	async getMySaves() {
		const db = wx.cloud.database()
		const tempSavedList = []
		for (const id of this.data.savedIdList) {
			const tempPost = await db.collection('posts').where({
				_id: id
			}).get()
			tempSavedList.push(tempPost.data[0])
		}
		this.setData({
			savedPost: tempSavedList
		})
  },
	async getMyProfile() {
		// 要先执行这个，这个拿了userInfo里面有openid！
		wx.showLoading({
			title: '获取用户信息中，请耐心等待...',
			mask: true
		})
		const userData = await getMyUserInfo()
		this.setData({
			userInfo: userData
		})
		if(this.data.userInfo.zipcode)
		{
			this.setData({
				geoInfo: zipCodeInfo.data[[this.data.userInfo.zipcode]].city + ", " + zipCodeInfo.data[[this.data.userInfo.zipcode]].state_id,
			})
		}
		else
		{
			this.setData({
				geoInfo: "未知"
			})
		}
		wx.hideLoading()

	},
	async getTagsCount() {
		// TODO: 不知道为什么_openid: undefined也能拿到数据
		const db = wx.cloud.database()
		const userId = this.data.userInfo._id ? this.data.userInfo._id : ''
    	// 分别计算两种帖子的数量
		const lifeCount = await db.collection('posts').where({
			_openid: userId,
			postType: "life"
		}).count()
		const sellingCount = await db.collection('posts').where({
			_openid: userId,
			postType: "selling"
		}).count()
		const saveRecord = await db.collection('saveList').where({
			_id: userId
    }).get()
    if (saveRecord.data.length != 0)
    {
      this.setData({
        savedIdList: saveRecord.data[0].list
      })
    }
		
		let newTags = this.data.tags
		newTags[0].count = lifeCount.total
		newTags[1].count = sellingCount.total
		newTags[2].count = this.data.savedIdList.length
		this.setData({
			tags: newTags
		})
	},
	async getUserPostData(limit = 20, offset = 0, Types = ['life','selling']) {
		// TODO: 不知道为什么_openid: undefined也能拿到数据
		const db = wx.cloud.database()
    	const userId = this.data.userInfo._id ? this.data.userInfo._id : ''
		// 把Types map到一个object中执行where
		const condition = Types.map(type => ({
		    postType: type
		}));
		const postsListResult = await db.collection('posts').where({
			_openid: userId,
			$or: condition
		}).limit(limit).skip(offset).get()
		return postsListResult.data
	},
	navigateToDetailSaved(event) {
		const postIndex = event.currentTarget.dataset.index
		const postData = JSON.stringify(this.data.savedPost[postIndex])
		wx.navigateTo({
			url: `/pages/detail/detail?data=${encodeURIComponent(postData)}`
		});
	},
	navigateToDetail(event) {
		const postIndex = event.currentTarget.dataset.index
		let postData = this.data.posts[postIndex]
		const currentUserInfo = this.data.userInfo
		const userData = {
			avatarUrl: currentUserInfo.avatarUrl,
			emailAddress: currentUserInfo.emailAddress,
			phone: currentUserInfo.phone,
			nickname: currentUserInfo.nickname,
			zipcode: currentUserInfo.zipcode,
			isUserVerified: currentUserInfo.isUserVerified,
			isPhoneChecked: currentUserInfo.isPhoneChecked,
			isEmailChecked: currentUserInfo.isEmailChecked
		}
		Object.assign(postData, userData)
		const data = JSON.stringify(postData)
		wx.navigateTo({
			url: `/pages/detail/detail?data=${encodeURIComponent(data)}`
		});
	},
	// 分享给朋友
	onShareAppMessage: function(options) {
		return {
			title: 'Hipond你的留学之家',
			path: '/pages/tab-bar/mine/mine?pageId=' + this.data.currentPageId,
			imageUrl: 'cloud://hipond-0gvw9rfhe8bc4b53.6869-hipond-0gvw9rfhe8bc4b53-1322334204/appImages/button_post_2nd.png',
			success: function(res) {
				// 分享成功后的回调
				console.log('分享成功');
			},
			fail: function(res) {
				// 分享失败后的回调
				console.log('分享失败');
			}
		};
	},
	// 分享到朋友圈
	onShareTimeline: function() {
		return {
			title: 'Hipond你的留学之家',
			path: '/pages/tab-bar/mine/mine?pageId=' + this.data.currentPageId,
			imageUrl: 'cloud://hipond-0gvw9rfhe8bc4b53.6869-hipond-0gvw9rfhe8bc4b53-1322334204/appImages/button_post_2nd.png' 
		};
	},
})