// pages/tab-bar/more/more.js
Page({
	data: {
		currentTabbarIndex: 4,
		version: "V0.4.5"
	},
	onLoad() {
		if (typeof this.getTabBar === 'function' && this.getTabBar()) {
			this.getTabBar().setData({
				selected: this.data.currentTabbarIndex
			})
		}

		const accountInfo = wx.getAccountInfoSync();
		console.log(accountInfo)
		// 保留自动显示版本号，仅正式版可用
		// this.setData({
		// 	version: accountInfo.miniProgram.version
		// })
	},

	privacyPage() {
		wx.openPrivacyContract({
		  })
	},

	copyOfficialSite() {
		wx.setClipboardData({
			data: 'https://hipond.cc/',
			success(res) {
				wx.getClipboardData({
					success(res) {
						wx.showToast({
							title: '网址已复制',
							icon: 'success',
							duration: 1500
						})
					}
				})
			}
		})
	},

	copyOfficialEmail() {
		wx.setClipboardData({
			data: 'info@hipond.cc',
			success(res) {
				wx.getClipboardData({
					success(res) {
						wx.showToast({
							title: '邮箱已复制',
							icon: 'success',
							duration: 1500
						})
					}
				})
			}
		})
	},

	copyRedAccount() {
		wx.setClipboardData({
			data: '9615091209',
			success(res) {
				wx.getClipboardData({
					success(res) {
						wx.showToast({
							title: '小红书已复制',
							icon: 'success',
							duration: 1500
						})
					}
				})
			}
		})
	}
})