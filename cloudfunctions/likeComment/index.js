// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const wxContext = cloud.getWXContext()
	const openid = wxContext.OPENID
	const _ = db.command
	let updated_data = []

	try {
		const record = await db.collection('likeCmtList').where({
			_id: openid
		}).get()

		if (record.data.length === 0 || !record.data[0].list) {
			throw new Error("No like comment found, new document is going be added.")
		}

		const data = record.data[0].list
		updated_data = data

		if (!data.includes(event.commentId)) {
			await db.collection('comments').doc(event.commentId).update({
				data: {
					likeCount: _.inc(1)
				}
			});
			updated_data.push(event.commentId)
		} else {
			updated_data = updated_data.filter(item => item !== event.commentId);
			await db.collection('comments').doc(event.commentId).update({
				data: {
					likeCount: _.inc(-1)
				}
			});
		}

		const updateResult = await db.collection('likeCmtList').doc(openid).update({
			data: {
				list: updated_data
			}
		});

		return {
			success: true,
			result: updateResult
		}
	} catch (error) {
		console.error(error)

		// If the document does not exist, create a new one
		try {
			const addResult = await db.collection('likeCmtList').add({
				data: {
					_id: openid,
					list: [event.commentId]
				}
			});

			await db.collection('comments').doc(event.commentId).update({
				data: {
					likeCount: _.inc(1)
				}
			});

			return {
				success: true,
				result: addResult
			}
		} catch (addError) {
			console.error(addError)
			return {
				success: false,
				error: addError
			}
		}
	}
}