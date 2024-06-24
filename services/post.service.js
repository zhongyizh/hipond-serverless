async function deletePost(postId, imageUrls) {
	const db = wx.cloud.database();
	return new Promise((resolve, reject) => {
		db.collection('posts').doc(postId).remove({
			success: res => {
				resolve(res);
				console.log("🚮 detail.js: deletePost(): deleting post images: ", imageUrls);
				wx.cloud.deleteFile({
					fileList: imageUrls,
					success: res => {
						console.log("🚮 detail.js: deletePost(): successfully deleted post images: ", res.fileList);
					},
					fail: console.error
				})
				console.log("🚮 detail.js: deletePost(): successfully deleted the post: ", res.data);
			},
			fail: err => {
				reject(err);
			}
		})
	});
}

module.exports = {
	deletePost
}
