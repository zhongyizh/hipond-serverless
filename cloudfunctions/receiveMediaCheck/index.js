// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
	const db = cloud.database()
	const traceId = event.trace_id
	const record = await db.collection('imageCheckStatus').doc(traceId).get()
	const postId = record.data.postId
	if (event.result.suggest === 'pass') {
		await db.collection('imageCheckStatus').doc(traceId).update({
			data: {
				isChecked: true
			}
		})
	} else {
		await db.collection('posts').doc(postId).update({
			data: {
				body: '该内容已违规，暂不展示',
				title: '该内容已违规，暂不展示',
				isImgChecked: false
			}
		})
	}
	const imageCheckResult = await db.collection('imageCheckStatus').where({ postId: postId }).get()
	const allPassed = imageCheckResult.data.every(image => image.isChecked)
	if (allPassed) {
		await db.collection('posts').doc(postId).update({
				data: {
					isImgChecked: true
				}
		})
	}
	// 在拿到审核结果后删除掉记录节省空间
	await db.collection('imageCheckStatus').doc(traceId).remove();

	return {
		event,
		record,
		imageCheckResult
	}
}