// pages/tab-bar/index/index.js
import { getPostDisplayData } from '../../../utils/util'

Page({
	data: {
		list: [],
		currentTabbarIndex: 0,
		maxLimit: 20,
		offset: 0,
		isEnd: false,
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
		if (!this.data.isEnd) {
			const postData = await getPostDisplayData(this.data.maxLimit, this.data.offset)
			const currentLength = postData.length
			const newOffset = this.data.offset + currentLength
			this.setData({
				list: [...this.data.list, ...postData],
				offset: newOffset,
				isEnd: currentLength < this.data.maxLimit
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
})
