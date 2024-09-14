// pages/tab-bar/shop/shop.js
Page({
	data: {
		currentTabbarIndex: 1,
	},

	onLoad() {
		if(typeof this.getTabBar === 'function' && this.getTabBar()) {
			this.getTabBar().setData({
				selected: this.data.currentTabbarIndex
			})
		}

	},
})