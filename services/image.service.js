async function uploadImages(postId = "", filePaths) {
	var uploadTasks = [];
	console.log("image.service.js: uploadImages(): ", filePaths);
    filePaths.forEach((f) => uploadTasks.push(
        new Promise((resolve, reject) => {
            wx.cloud.uploadFile({
                cloudPath: 'postImages/' + postId + '/' + f.url.split('/').pop(),
                filePath: f.url,
                success: res => {
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
	console.log("image.service.js: deleteImages(): ", filePaths);
    filePaths.forEach((f) => deletionTasks.push(
        new Promise((resolve, reject) => {
            wx.cloud.deleteFile({
				fileList: f.url,
				success: res => {
					console.log("🚮 image.service.js: deleteImages(): successfully deleted image: ", res);
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