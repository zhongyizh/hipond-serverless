// pages/login/login.js
import {
	getMyUserInfo
} from '../../utils/util'

// 邮编map
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
		isPhoneChecked: false,
		isEmailChecked: false,
		isOtherContactChecked: false,
		isDisabled: true,
		isFocusNickname: false,
	},
	async onLoad() {
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
					// 用户同意隐私协议后给昵称input聚焦
					this.setData({
						isFocusNickname: true
					})
				},
				fail: res => {
					console.log('用户拒绝了隐私协议')
				}
			})
		} else {
			this.setData({
				isFocusNickname: true
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
	checkboxChange: function (e) {
		const items = e.detail.value;
		const isChecked = (id) => items.includes(id);
		const isPhoneChecked = isChecked("cb-phone");
		const isEmailChecked = isChecked("cb-email");
		const isOtherContactChecked = isChecked("cb-other-contact");

		this.setData({
			isPhoneChecked: isPhoneChecked,
			isEmailChecked: isEmailChecked,
			isOtherContactChecked: isOtherContactChecked
		});
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
				isPhoneChecked: userData.isPhoneChecked ? userData.isPhoneChecked : false,
				isEmailChecked: userData.isEmailChecked ? userData.isEmailChecked : false,
				isOtherContactChecked: userData.isOtherContactChecked ? userData.isOtherContactChecked : false
			})
			this.updateButtonStatus();
		}
	},
	updateButtonStatus() {
		// 按钮启用条件: nickname不为空，两个复选框至少选中一个且对应的输入框不为空
		let isDisabled = true;

		const isPhoneValid = !this.data.isPhoneChecked || (this.data.isPhoneChecked && this.data.phone !== "");
		const isEmailValid = !this.data.isEmailChecked || (this.data.isEmailChecked && this.data.emailAddress !== "");
		const isOtherContactValid = !this.data.isOtherContactChecked || (this.data.isOtherContactChecked && this.data.otherContact !== "");

		const atLeastOneCheckedAndEntered = (this.data.isPhoneChecked && this.data.phone !== "") || (this.data.isEmailChecked && this.data.emailAddress !== "") || (this.data.isOtherContactChecked && this.data.otherContact !== "");

		if (this.data.nickname !== "" && atLeastOneCheckedAndEntered && isPhoneValid && isEmailValid && isOtherContactValid) {
			isDisabled = false;
		}
		this.setData({
			isDisabled: isDisabled
		});
	},
	async saveUserInfo() {
		const nickname = this.data.nickname
		const emailAddress = this.data.emailAddress
		const phone = this.data.phone
		const isChangeAvatar = this.data.isChangeAvatar
		const zipcode = this.data.zipcode
		const isPhoneChecked = this.data.isPhoneChecked
		const isEmailChecked = this.data.isEmailChecked
		const isOtherContactChecked = this.data.isOtherContactChecked
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
			isPhoneChecked: isPhoneChecked,
			isEmailChecked: isEmailChecked,
			isOtherContactChecked: isOtherContactChecked
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