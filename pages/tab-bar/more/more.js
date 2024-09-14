// pages/tab-bar/more/more.js
Page({
	data: {
		currentTabbarIndex: 4,
	},
	onLoad() {
		if(typeof this.getTabBar === 'function' && this.getTabBar()) {
			this.getTabBar().setData({
				selected: this.data.currentTabbarIndex
			})
		}
	},
})