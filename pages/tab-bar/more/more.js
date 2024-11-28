// pages/tab-bar/more/more.js
Page({
	data: {
		currentTabbarIndex: 4,
		version: "体验版"
	},

	onLoad() {
		if (typeof this.getTabBar === 'function' && this.getTabBar()) {
			this.getTabBar().setData({
				selected: this.data.currentTabbarIndex
			})
		}
		
		const accountInfo = wx.getAccountInfoSync()
		if (accountInfo.miniProgram.envVersion === 'release') {
			this.setData({
				version: 'V' + accountInfo.miniProgram.version
			})
		}
	},

	privacyPage() {
		wx.openPrivacyContract({})
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
	},

	contactService() {
		console.log("客服")
		wx.openCustomerServiceChat({
			extInfo: {
				url: 'https://work.weixin.qq.com/kfid/kfc54ad60c34a469304'
			},
			corpId: 'ww1c8710cb10bd5410',
			success(res) {}
		})
	}
})