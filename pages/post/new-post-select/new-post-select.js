// pages/post/new-post-select/new-post-select.js
import { getMyUserInfo } from '../../../utils/util'

Page({
	data: {

	},
	async onLoad() {
	},
	async checkUserInfo() {
        wx.showLoading({
			title: "获取用户信息中，请耐心等待...",
			mask: true,
        });
        try {
			const userData = await getMyUserInfo();
			wx.hideLoading();
			if (userData && userData.nickname && (userData.phone || userData.emailAddress)) {
				console.log("用户已填写信息，符合发帖条件");
				return true;
			} else {
				wx.showModal({
					title: "您还未添加联系方式",
					content: "请完善用户资料后进行发帖",
					success: function(res) {
						if (res.confirm) {
							wx.navigateTo({
								url: "/pages/login/login"
							});
						} else if (res.cancel) {
							return
						}
					}
				})
				return false;
			}
        } catch (error) {
			wx.hideLoading();
			console.error("获取用户信息失败:", error);
			wx.showToast({
				title: "获取用户信息失败",
				icon: "none",
			});
			return false;
        }
	},
	async post2nd() {
		const isUserEligible = await this.checkUserInfo();
		if (isUserEligible) {
			wx.navigateTo({
				url: '/pages/post/new-post-listing/new-post-listing',
			})
		}
	},
	async postLife() {
		const isUserEligible = await this.checkUserInfo();
		if (isUserEligible) {
			wx.navigateTo({
				url: '/pages/post/new-post/new-post',
			})
		}
	}
})
