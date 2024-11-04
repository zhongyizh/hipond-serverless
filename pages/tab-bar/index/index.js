// pages/tab-bar/index/index.js
import { getLatestPosts, getPaginatedPosts } from '../../../utils/util'

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
		// 通过贴子总数判断是否有贴子被删除，删除贴子后需要刷新
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
		// 获取最新的贴子，发贴时间大于当前第一篇贴子的时间
		const newPostData = await getLatestPosts(this.data.maxLimit, latestPostDate)
		this.setData({
			list: [...this.data.list, ...newPostData]
		})
		// 获取分页加载的贴子，发贴时间小于当前最后一篇贴子的时间
		const morePostData = await getPaginatedPosts(this.data.maxLimit, lastPostDate)
		this.setData({
			list: [...this.data.list, ...morePostData]
		})
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
