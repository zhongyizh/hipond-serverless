// pages/tab-bar/index/index.js
import { getLatestPosts, getPostDisplayData } from '../../../utils/util'

Page({
	data: {
		list: [],
		currentTabbarIndex: 0,
		maxLimit: 20,
		currentPostsCount: 0
	},
	onLoad() {
		if(typeof this.getTabBar === 'function' &&
			this.getTabBar()) {
			this.getTabBar().setData({
				selected: this.data.currentTabbarIndex
			})
		}
	},
	onShow() {
		console.log("Index Page onShow")
		this.getPostList()
	},
	onReachBottom() {
		this.getPostList()
	},
	async getPostList() {
		const db = wx.cloud.database()
		const countResult = await db.collection('posts').where({
			isImgChecked: true
		}).count()
		const total = countResult.total
		// 删除贴子后需要刷新
		const needRefresh = this.data.currentPostsCount > total
		if (needRefresh) {
			this.setData({
				list: []
			})
		}
		this.setData({
			currentPostsCount: total
		})
		const postList = this.data.list
		let latestPostDate = Date.now()
		let lastPostDate = Date.now()
		if (postList.length > 0) {
			latestPostDate = postList[0].postDate
			lastPostDate = postList[postList.length - 1].postDate
		}
		const newPostData = await getLatestPosts(this.data.maxLimit, latestPostDate)
		this.setData({
			list: [...this.data.list, ...newPostData]
		})
		console.log("Index page get latest posts latestPostDate = " + latestPostDate)
		console.log("Index page get latest posts postData.length = " + newPostData.length)
		const morePostData = await getPostDisplayData(this.data.maxLimit, lastPostDate)
		this.setData({
			list: [...this.data.list, ...morePostData]
		})
		console.log("Index page get posts lastPostDate = " + lastPostDate)
		console.log("Index page get posts postData.length = " + morePostData.length)
	},
	navigateToDetail(event) {
		const postIndex = event.currentTarget.dataset.index
		const postData = JSON.stringify(this.data.list[postIndex])
		// 使用URLencoder解决特殊符号问题
		wx.navigateTo({
			url: `/pages/detail/detail?data=${encodeURIComponent(postData)}`
		});
	},
	// 分享给朋友
	onShareAppMessage: function() {
		return {
			title: 'Hipond你的留学之家',
			path: '/pages/tab-bar/index/index?pageId=' + this.data.currentPageId,
			imageUrl: 'cloud://hipond-0gvw9rfhe8bc4b53.6869-hipond-0gvw9rfhe8bc4b53-1322334204/appImages/button_post_2nd.png',
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
		return {
			title: 'Hipond你的留学之家',
			path: '/pages/tab-bar/index/index?pageId=' + this.data.currentPageId,
			imageUrl: 'cloud://hipond-0gvw9rfhe8bc4b53.6869-hipond-0gvw9rfhe8bc4b53-1322334204/appImages/button_post_2nd.png' 
		};
	},
})
