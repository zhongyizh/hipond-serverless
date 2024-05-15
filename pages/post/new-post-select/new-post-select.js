// pages/post/new-post-select/new-post-select.js
import { getMyUserInfo } from '../../../utils/util'

Page({
	data: {

	},
	async onLoad() {
		wx.showLoading({
			title: '获取用户信息中，请耐心等待...',
			mask: true
		})
		const userData = await getMyUserInfo()
		if (userData && userData.nickname && (userData.phone || userData.emailAddress)) {
			console.log("用户已填写信息，符合发帖条件")
		} else {
			wx.navigateTo({
				url: "/pages/login/login",
			})
		}
		wx.hideLoading()
	},
	post2nd: function() {
    wx.navigateTo({
      url: '/pages/post/new-post-listing/new-post-listing',
    })
  },
  postLife: function() {
    wx.navigateTo({
      url: '/pages/post/new-post/new-post',
    })
  },
})