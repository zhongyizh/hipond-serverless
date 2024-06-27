async function uploadImages(postId = "", filePaths) {
	var uploadTasks = [];
	console.log("⏳ image.service.js: uploadImages(): Uploading Images: ", filePaths);
    filePaths.forEach((f) => uploadTasks.push(
        new Promise((resolve, reject) => {
			f = f.url ?? f;
            wx.cloud.uploadFile({
                cloudPath: 'postImages/' + postId + '/' + f.split('/').pop(),
                filePath: f,
                success: res => {
					console.log("✅ image.service.js: uploadImages(): Successfully Uploaded Image: ", res);
                    resolve(res.fileID);
                },
                fail: err => {
                    reject(err);
                }
            });
        })
    ));
    return Promise.all(uploadTasks);
}

async function deleteImages(filePaths = ['']) {
	var deletionTasks = [];
	console.log("⏳ image.service.js: deleteImages(): Deleting Images: ", filePaths);
    filePaths.forEach((f) => deletionTasks.push(
        new Promise((resolve, reject) => {
			f = f.url ?? f;
            wx.cloud.deleteFile({
				fileList: f,
				success: res => {
					console.log("🚮 image.service.js: deleteImages(): Successfully Deleted Image: ", res);
					resolve(res);
				},
				fail: res => reject(res)
			})
        })
    ));
    return Promise.all(deletionTasks);
}

module.exports = {
	uploadImages,
	deleteImages
}