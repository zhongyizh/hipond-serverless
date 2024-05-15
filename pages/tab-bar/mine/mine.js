// pages/tab-bar/mine/mine.js
import { getMyUserInfo } from '../../../utils/util'

Page({
	data: {
		currentTabbarIndex: 2,
		currentTagIndex: 0,
		tags: [{
			text: "动态",
			count: "0"
		}, {
			text: "在售",
			count: "0"
		}, {
			text: "收藏",
			count: "0"
		}],
		userInfo: {},
		posts: [],
		maxLimit: 20,
		offset: 0,
		isEnd: false,
	},
	async onLoad() {
    if(typeof this.getTabBar === 'function' &&
			this.getTabBar()) {
			this.getTabBar().setData({
				selected: this.data.currentTabbarIndex
			})
		}

		await this.getMyProfile()
		this.getTagsCount()
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
				// offset: 0,
				// isEnd: false
			})
			this.getRelevantPosts()
		}
	},
	getRelevantPosts() {
		switch(this.data.currentTagIndex) {
			case 0: // 动态页面
				this.getMyPosts()
				break;
			case 1: // 在售页面
				// 目前没写下面这两个functions
				// this.getMySellings()
				break;
			case 2: // 收藏页面
				// this.getMySaves()
				break;
			default:
				console.log("Invalid current tag index")
		}
	},
	async getMyPosts() {
		if (!this.data.isEnd) {
			const postData = await this.getUserPostData(this.data.maxLimit, this.data.offset)
			const currentLength = postData.length
			const newOffset = this.data.offset + currentLength
			this.setData({
				posts: [...this.data.posts, ...postData],
				offset: newOffset,
				isEnd: currentLength < this.data.maxLimit
			})
		}
	},
	getMySellings() {
		// TODO: Finish this
		this.setData({
			posts: []
		})
	},
	getMySaves() {
		// TODO: Finish this
		this.setData({
			posts: []
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
		wx.hideLoading()
	},
	async getTagsCount() {
		// TODO: 不知道为什么_openid: undefined也能拿到数据
		const db = wx.cloud.database()
		const userId = this.data.userInfo._id ? this.data.userInfo._id : ''
		const countResult = await db.collection('posts').where({
			_openid: userId
		}).count()
		const total = countResult.total
		let newTags = this.data.tags
		newTags[0].count = total
		this.setData({
			tags: newTags
		})
	},
	async getUserPostData(limit = 20, offset = 0) {
		// TODO: 不知道为什么_openid: undefined也能拿到数据
		const db = wx.cloud.database()
		const userId = this.data.userInfo._id ? this.data.userInfo._id : ''
		const postsListResult = await db.collection('posts').where({
			_openid: userId
		}).limit(limit).skip(offset).get()
		return postsListResult.data
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
		}
		Object.assign(postData, userData)
		const data = JSON.stringify(postData)
		wx.navigateTo({
			url: `/pages/detail/detail?data=${data}`
		});
	},
})