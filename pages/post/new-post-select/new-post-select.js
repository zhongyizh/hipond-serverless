// pages/post/new-post-select/new-post-select.js
import { getMyUserInfo } from '../../../utils/util'

Page({
	data: {

	},
	async onLoad() {
	},
	async post2nd() {
		wx.navigateTo({
			url: '/pages/post/new-post-listing/new-post-listing',
		})
	},
	async postLife() {
		wx.navigateTo({
			url: '/pages/post/new-post/new-post',
		})
	}
})
