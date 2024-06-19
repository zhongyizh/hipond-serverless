// pages/tab-bar/index/index.js
import { getPostDisplayData } from '../../../utils/util'

Page({
	data: {
		scrollHeight: wx.getWindowInfo().windowHeight * 1.8,
		list: [],
		currentTabbarIndex: 0,
		maxLimit: 20,
		offset: 0
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
		const isEnd = this.data.offset >= total
		if (!isEnd) {
			const postData = await getPostDisplayData(this.data.maxLimit, this.data.offset)
			const currentLength = postData.length
			const newOffset = this.data.offset + currentLength
			this.setData({
				list: [...this.data.list, ...postData],
				offset: newOffset
			})
		}
	},
	navigateToDetail(event) {
		const postIndex = event.currentTarget.dataset.index
		const postData = JSON.stringify(this.data.list[postIndex])
		wx.navigateTo({
			url: `/pages/detail/detail?data=${postData}`
		});
  },
  // 分享给朋友
  onShareAppMessage: function() {
    return {
      title: 'Hipond你的留学之家',
      path: '/pages/tab-bar/index/index?pageId=' + this.data.currentPageId,
      imageUrl: '/image/button_post_2nd.png',
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
      imageUrl: '/image/button_post_2nd.png' 
    };
  },
})
