// pages/login/login.js
import {
	getMyUserInfo
} from '../../utils/util'

Page({
	data: {
		nickname: "",
		zipcode: "",
		phone: "",
		emailAddress: "",
		otherContact: "",
		avatarUrl: "/image/avatar_icon_default_show.png",
		isChangeAvatar: false,
		isVerified: false,
		isDisabled: true,
	},
	async onShow() {
		wx.showLoading({
			title: '获取用户信息中，请耐心等待...',
			mask: true
		})
		await this.loadUserInfoData()
		wx.hideLoading()
	},
	onChooseAvatar(e) {
		const {
			avatarUrl
		} = e.detail
		this.setData({
			avatarUrl,
			isChangeAvatar: true,
		})
	},
	nicknameChange(res) {
		var textVal = res.detail.value;
		this.setData({
			nickname: textVal
		})
		this.updateButtonStatus();
	},
	handleTouchInput() {
		if (wx.requirePrivacyAuthorize) {
			wx.requirePrivacyAuthorize({
				success: res => {
					console.log('用户同意了隐私协议 或 无需用户同意隐私协议')
				},
				fail: res => {
					console.log('用户拒绝了隐私协议')
				}
			})
		}
	},
	zipcodeChange(res) {
		var textVal = res.detail.value;
		this.setData({
			zipcode: textVal
		})
		this.updateButtonStatus();
	},
	phoneChange(res) {
		var textVal = res.detail.value;
		this.setData({
			phone: textVal
		})
		this.updateButtonStatus();
	},
	emailChange(res) {
		var textVal = res.detail.value;
		this.setData({
			emailAddress: textVal
		})
		this.updateButtonStatus();
	},

	otherContactChange(res) {
		var textVal = res.detail.value;
		this.setData({
			otherContact: textVal
		})
		this.updateButtonStatus();
	},

	async loadUserInfoData() {
		const userData = await getMyUserInfo()
		if (userData && userData.nickname) {
			this.setData({
				nickname: userData.nickname,
				avatarUrl: userData.avatarUrl,
				phone: userData.phone,
				zipcode: userData.zipcode,
				isVerified: userData.isUserVerified,
				emailAddress: userData.emailAddress,
				otherContact: userData.otherContact,
			})
			this.updateButtonStatus();
		}
	},
	updateButtonStatus() {
		let isDisabled = true;

		if (this.data.nickname !== "" && (this.data.emailAddress !== "" || this.data.phone !== "" || this.data.otherContact != "")) {
			isDisabled = false;
		}
		this.setData({
			isDisabled: isDisabled
		});
	},
	studentVeri(){
		console.log("toveripage")
		wx.navigateTo({
			url: '/pages/verification/verification' 
		  });
	},

	disabledTapped() {
		if (this.data.nickname == "") {
			wx.showToast({
				icon: "none",
				title: '请输入昵称',
			})
		} else {
			wx.showToast({
				icon: "none",
				title: '请添加至少一个联系方式',
			})
		}

	},

	async saveUserInfo() {
		const isChangeAvatar = this.data.isChangeAvatar
		const nickname = this.data.nickname
		const zipcode = this.data.zipcode
		const emailAddress = this.data.emailAddress
		const phone = this.data.phone
		const otherContact = this.data.otherContact
		let avatarUrl = this.data.avatarUrl;
		if (isChangeAvatar) {
			avatarUrl = await this.uploadAvatar()
		}
		const data = {
			emailAddress: emailAddress,
			nickname: nickname,
			zipcode: zipcode,
			phone: phone,
			avatarUrl: avatarUrl,
			otherContact: otherContact,
		}

		wx.cloud.callFunction({
			name: 'setUserInfo',
			data: data,
			success: function (res) {
				if (res.result) {
					wx.showToast({
						title: '保存成功',
						icon: 'success',
						duration: 1000,
						mask: true,
						complete: function () {
							setTimeout(function () {
								wx.navigateBack()
							}, 1000)
						}
					})
				}
			},
			fail: function (res) {
				wx.showToast({
					title: '保存失败',
					icon: 'error',
					duration: 1000,
					mask: true,
					complete: function () {
						setTimeout(function () {
							wx.navigateBack()
						}, 1000)
					}
				})
			}
		})
	},
	uploadAvatar() {
		// TODO: 需要把同一个用户的头像存到同一个云端的位置
		return new Promise((resolve, reject) => {
			wx.cloud.uploadFile({
				cloudPath: 'avatar/' + this.data.avatarUrl.split('/').pop(),
				filePath: this.data.avatarUrl,
				success: res => {
					resolve(res.fileID);
				},
				fail: err => {
					reject(err);
				}
			})
		})
	},
})