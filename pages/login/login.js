// pages/login/login.js
import { getMyUserInfo } from '../../utils/util'

Page({
	data: {
		nickname: "",
		zipcode: "",
		wechatId: "",
		emailAddress: "",
		avatarUrl: "/image/avatar_icon_default_show.png",
		isChangeAvatar: false,
		isVerified: false,
		isWechatChecked: false,
		isEmailChecked: false,
		isDisabled: true,
		isShowPrivacy: false,
	},
	async onLoad() {
		wx.showLoading({
			title: '获取用户信息中，请耐心等待...',
			mask: true
		})
		await this.loadUserInfoData()
		this.getPrivacySettingHelper()
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
		const isWechatChecked = isChecked("cb-wechat-id");
		const isEmailChecked = isChecked("cb-email");
		this.setData({
			isWechatChecked: isWechatChecked,
			isEmailChecked: isEmailChecked
		});
		this.updateButtonStatus();
	},
	wechatIdChange(res) {
		var textVal = res.detail.value;
		this.setData({
			wechatId: textVal
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
	async loadUserInfoData() {
		const userData = await getMyUserInfo()
		if (userData && userData.nickname) {
			this.setData({
				nickname: userData.nickname,
				avatarUrl: userData.avatar_url,
				wechatId: userData.wechat_id,
				zipcode: userData.postal_code,
				emailAddress: userData.email_address
			})
			// TODO: 这个好像有逻辑漏洞
			if (userData.wechat_id != "") {
				this.setData({
					isWechatChecked: true
				});
			}
			if (userData.email_address != "") {
				this.setData({
					isEmailChecked: true
				});
			}
			this.updateButtonStatus();
		}
	},
	updateButtonStatus() {
		// 按钮启用条件: nickname不为空，两个复选框至少选中一个且对应的输入框不为空
		let isDisabled = true;
		if (this.data.nickname !== "" &&
		((this.data.isWechatChecked && this.data.wechatId !== "") || (this.data.isEmailChecked && this.data.emailAddress !== ""))) {
			isDisabled = false;
		}
		this.setData({
			isDisabled: isDisabled
		});
	},
	async saveUserInfo() {
    const nickname = this.data.nickname
    const emailAddress = this.data.emailAddress
    const wechatId = this.data.wechatId
    const isChangeAvatar = this.data.isChangeAvatar
		const zipcode = this.data.zipcode

		let avatarUrl = this.data.avatarUrl;
		if (isChangeAvatar) {
			avatarUrl = await this.uploadAvatar()
		}
		const data = {
			email_address: emailAddress,
			nickname: nickname,
			postal_code: zipcode,
			wechat_id: wechatId,
			avatar_url: avatarUrl
		}

		wx.cloud.callFunction({
			name: 'setUserInfo',
			data: data,
			success: function(res) {
				if (res.result) {
					wx.showToast({
						title: '保存成功',
						icon: 'success',
					})
				}
			},
			fail: function(res) {
				wx.showToast({
					title: '保存失败',
					icon: 'error',
				})
			}
		})
		wx.navigateBack()
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
	// TODO: 隐私协议
	getPrivacySettingHelper() {
		// 隐私协议
		wx.getPrivacySetting({
      success: res => {
        console.log(res) // 返回结果为: res = { needAuthorization: true/false, privacyContractName: '《xxx隐私保护指引》' }
        if (res.needAuthorization) {
          // 需要弹出隐私协议
          this.setData({
            isShowPrivacy: true
          })
        }
      },
      fail: () => {},
      complete: () => {}
    })
	},
	handleAgreePrivacyAuthorization() {
    // 用户同意隐私协议事件回调
		// 用户点击了同意，之后所有已声明过的隐私接口和组件都可以调用了
		console.log('用户同意隐私协议')
		this.setData({
			isShowPrivacy: false
		})
  },
  handleOpenPrivacyContract() {
    // 打开隐私协议页面
    wx.openPrivacyContract({
      success: () => {}, // 打开成功
      fail: () => {}, // 打开失败
      complete: () => {}
    })
  }
})