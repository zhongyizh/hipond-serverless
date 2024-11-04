import { uploadImages, deleteImages } from "./image.service"
import { imgSecCheck } from "./security.service";
async function createPost(newPostData) {
	const db = wx.cloud.database();
	// 第一步：创建新帖子
	console.log("⏳ post.service.js: createPost(): Creating New Post: ", newPostData);
	const result = await new Promise((resolve, reject) => {
		db.collection('posts').add({
			data: newPostData,
			success: res => {
				resolve(res);
			},
			fail: err => {
				reject(err);
			}
		});
	});
	const newPostId = result._id;
	// 第二步：上传图片
	const newImgUrls = await uploadImages(newPostId, newPostData.imageUrls);
	console.log("✏️ post.service.js: createPost(): Uploaded New Images: ", newImgUrls);
	for (let fileId of newImgUrls) {
		let traceId = await imgSecCheck(newPostId, fileId);
		console.log("✅ post.service.js: createPost(): Image Security Compliance Check TraceId for " + fileId + " is " + traceId);
	}
	// 第三步：更新帖子，添加图片URL
	const updateResult = await new Promise((resolve, reject) => {
		db.collection("posts").doc(newPostId).update({
			data: { imageUrls: newImgUrls },
			success: res => resolve(res),
			fail: err => reject(err)
		});
	});
	console.log("⏳ post.service.js: createPost(): Update new images result: " + updateResult.stats.updated);
	return updateResult;
}

async function createComment(newCmtData) {
	const db = wx.cloud.database();
	// 创建新评论
	console.log("⏳ post.service.js: createComment(): Creating New Comment: ", newCmtData);
	const result = await new Promise((resolve, reject) => {
		db.collection('comments').add({
			data: newCmtData,
			success: res => {
				resolve(res);
			},
			fail: err => {
				reject(err);
			}
		});
	});
	// If the new comment is a reply to another comment
    if (newCmtData.parent) {
        // Increment the repliesCount of the target comment
        console.log("⏳ post.service.js: createComment(): Incrementing repliesCount for comment: ", newCmtData.parent);
        console.log(newCmtData.parent);
        await new Promise((resolve, reject) => {
			wx.cloud.callFunction({
				name: 'incrementReplyCount',
				data: {
					parent: newCmtData.parent
				},
				success: res => {
					console.log("✔ post.service.js: createComment(): Incremented repliesCount for comment: ", newCmtData.parent);
					resolve(res);
				},
				fail: err => {
					console.error("❌ post.service.js: createComment(): Failed to increment repliesCount for comment: ", err);
					reject(err);
				}
			})
        });
    }

    return result;
}

async function editPost(newPostData) {
	const db = wx.cloud.database();
	if (!newPostData._id) return false;
	// TODO: id和别的postData最好分开作为两个参数传入，不然看上去很奇怪
	const postId = newPostData._id;
	delete newPostData['_id'];
	console.log("⏳ post.service.js: editPost(): Editing Post: ", newPostData);

	// 第一步：获取原始版本的旧帖子
	const oldPostRes = await db.collection("posts").doc(postId).get();
	const oldPostData = oldPostRes.data;
	console.log("✅ post.service.js: editPost(): Successfully Read Old Post Data: ", oldPostData);
	
	// 第二步：优化图片上传机制，删除旧的上传新的保留不动的
	// 获取原始文件列表和当前文件列表
	// 如果不是通过“编辑”按钮进来的就把oldFileList初始化成空数组
	const oldFileList = new Set(oldPostData.imageUrls ?? []); // Denote as A
	const newFileList = new Set(newPostData.imageUrls ?? []); // Denote as B
	// 计算要保留的文件 C = (A ∩ B)
	const filesToKeep = newFileList.intersection(oldFileList);
	// 计算要添加的文件 N = (B - C)
	const filesToAdd = newFileList.difference(filesToKeep);
	// 计算要删除的文件 D = (A - C)
	const filesToDelete = oldFileList.difference(filesToKeep);
	
	if (filesToAdd.size == 0) {
		newPostData.isImgChecked = true
	}
	console.log("⏳ post.service.js: editPost(): Optimizing Image Uploads: (filesToKeep, filesToAdd, filesToDelete) = ", filesToKeep, filesToAdd, filesToDelete);
	// 从数据库中清除掉要被删除的图片
	if (filesToDelete.size > 0) {
		await wx.cloud.deleteFile({ 
			fileList: Array.from(filesToDelete)
		});
		console.log("🚮 post.service.js: editPost(): Successfully Deleted Old Post Images");
	}
	// 计算编辑后帖子里所有图片的链接 P = (C + N)
	// 先上传C里面的图片，并且把获取到的数据库里的新链接加到P里
	
	const uploadResults = await uploadImages(postId, Array.from(filesToAdd));
	const newImgUrls = [...filesToKeep];
	console.log("✅ post.service.js: editPost(): Successfully Generated all New Images Urls: ", uploadResults);
	for (let fileId of uploadResults) {
		newImgUrls.push(fileId);
		let traceId = await imgSecCheck(postId, fileId);
		console.log("✅ post.service.js: editPost(): Image Security Compliance Check TraceId for " + fileId + " is " + traceId);
	}

	newPostData.imageUrls = newImgUrls;
	// 第三步：把帖子的所有信息更新成新的
	const updateResult = await db.collection("posts").doc(postId).update({
		data: newPostData	
	});
	console.log("✅ post.service.js: editPost(): Successfully Updated the Post: " + postId, updateResult);
	return updateResult;
}

async function deletePost(postId) {
	const db = wx.cloud.database();
	try {
		const post = await db.collection("posts").doc(postId).get();
		const imageUrls = post.data.imageUrls;
		// get only comments is enough
		const comments = await db.collection('comments').where({
		  postId: postId,
		  _tgtCmtId: "Post"
		}).get();
		// iterate over comments
		for (let i = 0; i < comments.data.length; i++) {
		  const commentId = comments.data[i]._id;
		  await deleteComment(commentId, "Post"); // delete each comment and its replies
		}

		await db.collection('posts').doc(postId).remove();
		console.log("🚮 Deleting Post Images...");
		await deleteImages(imageUrls);
	
		console.log("🚮 Successfully Deleted the Post and All Associated Comments and Replies: ", postId);
		return Promise.resolve();
	} catch (err) {
		console.error("❌ Error while deleting post, comments, or images: ", err);
		return Promise.reject(err);
	}
}

async function deleteComment(commentId, parent) {
	const db = wx.cloud.database();
	const _ = db.command;
	return new Promise((resolve, reject) => {
		wx.cloud.callFunction({
			name: 'deleteComments',
			data: {
				commentId: commentId,
				parent: parent
			},
			success: res => {
				console.log("✔ Successfully delete comment: ", parent);
				resolve(res);
			},
			fail: err => {
				console.error("❌ Failed to delete comment: ", err);
				reject(err);
			}
		})
	});
}

module.exports = {
	createPost,
	editPost,
	deletePost,
	createComment,
	deleteComment
}
