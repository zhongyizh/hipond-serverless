// pages/detail/detail.js
const conditionIconPath = new Map([
	["全新/仅开箱", "full-pie.svg"],
	["良好/轻微使用", "75-percent-pie.svg"],
	["一般/工作良好", "50-percent-pie.svg"],
	["需修理/零件可用", "25-percent-pie.svg"]
])

Page({
	data: {
		postData: [],
		conditionForDisplay: '',
		conditionIconPath: ''
	},
	onLoad(options) {
		const data = options.data
		const postData = JSON.parse(data)
		postData.postDate = this.parseDate(postData.postDate)
		this.setData({ postData })

		// wxml里有个本地的+1，这里去改数据库
		this.incrementViewCount()
		this.showCondition()
	},
	parseDate(date) {
		var dateObject = new Date(parseInt(date));
		// Get the Year, Month, and Day components
		const year = dateObject.getFullYear();
		const month = ('0' + (dateObject.getMonth() + 1)).slice(-2); // Adding 1 because getMonth() returns 0-indexed month
		const day = ('0' + dateObject.getDate()).slice(-2);
		return month + '/' + day + '/' + year
	},
	showCondition() {
		const condition = this.data.postData.condition
		if (condition) {
			this.setData({
				conditionForDisplay: condition.replace('/', '\n'),
				conditionIconPath: '/../../image/condition_circle/' + conditionIconPath.get(condition)
			})
		}
	},
	async incrementViewCount() {
		const _id = this.data.postData._id
		const db = wx.cloud.database()
		const _ = db.command
		await db.collection('posts').doc(_id).update({
			data: {
				viewCount: _.inc(1)
			},
			success: function(res) {
				console.log('incrementViewCount id: ' + _id + ' updated: ' + res.stats.updated + ' doc')
			}
		})
	},
	onTapContact() {
		// TODO: On Hold/已售出
		const postData = this.data.postData
		const phone = postData.phone ? '手机号: ' + postData.phone : '';
		const email = postData.emailAddress ? '邮箱：' + postData.emailAddress : '';
		let contact = '';
		if (phone && email) {
			contact = phone + '\n' + email;
		} else if (phone) {
			contact = phone;
		} else if (email) {
			contact = email;
		}
		console.log('成功复制到剪贴板：' + contact)
		wx.setClipboardData({
			data: contact,
			success: function(){
				wx.showToast({
					title: '复制成功',  
					icon: 'success',    
					duration: 2000,
				});
			}
		})
	}
})