// pages/verification/verification.js
const NOTICE_SUCCESS = '验证完成！'
const NOTICE_FAIL = '需要输入正确的以.edu结尾的邮箱哦！'

Page({
	data: {
		email: "",
		notice: "",
		isSuccessHidden: "true",
	},
	emailChange(res) {
		var textVal = res.detail.value;
		this.setData ({
				email: textVal
		})
	},
	emailConfirm(res) {
		const email = this.data.email;
		const eduPattern = /\.edu$/i; // Contains .edu (case insensitive)
		if (eduPattern.test(email)) {
			this.emailVerify(email)
			this.setData({
				notice: NOTICE_SUCCESS,
				isSuccessHidden: false
			})
			wx.navigateBack()
		}
		else {
			this.setData({
				notice: NOTICE_FAIL,
				isSuccessHidden: true
			})
		}
	},
	async emailVerify(email) {
		return new Promise((resolve, reject) => {
			wx.cloud.callFunction({
				name: 'studentVerification',
				data: {
					email: email
				},
				success: res => {
					resolve(res.result);
				},
				fail: err => {
					reject(err);
				}
			})
		})
	}
})