const Post = require("../models/post");
const fs = require("fs");

exports.createPost = (req, res, next) => {
	console.log(req.auth.userId);

	const post = new Post({
		userId: req.auth.userId,
		title: req.body.title,
		description: req.body.description,
		likes: 0,
		dislikes: 0,
		imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
	});
	post.save()
		.then(() => {
			res.status(201).json({
				message: "Post saved successfully!"
			});
		})
		.catch(error => {
			res.status(400).json({
				error: error
			});
		});
};

exports.getOnePost = (req, res, next) => {
	Post.findOne({
		_id: req.params.id
	})
		.then(post => {
			console.log(post);
			res.status(200).json(post);
		})
		.catch(error => {
			res.status(404).json({
				error: error
			});
		});
};

exports.modifyPost = (req, res, next) => {
	Post.findOne({ _id: req.params.id })
		.then(post => {
			const oldFile = post.imageUrl.split("/images/")[1];
			if (req.file) {
				fs.unlink(oldFile, () => {
					console.log("supprimé");
				});
			}
			if (post.userId != req.auth.userId) {
				return res.status(403).json({ message: "Not authorized" });
			} else {
				Post.updateOne(
					{
						_id: req.params.id
					},
					{
						_id: req.params.id,
						title: req.body.title,
						description: req.body.description,
						imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
					}
				)
					.then(() => res.status(200).json({ message: "Objet modifié!" }))
					.catch(error => res.status(401).json({ error }));
			}
		})
		.catch(error => {
			res.status(400).json({ error: "error " + error });
		});
};

exports.deletePost = (req, res, next) => {
	Post.findOne({ _id: req.params.id })
		.then(post => {
			console.log(post);
			if (post.userId != req.auth.userId) {
				return res.status(403).json({ message: "Not authorized" });
			} else {
				const filename = post.imageUrl.split("/images/")[1];
				fs.unlink(`images/${filename}`, () => {
					Post.deleteOne({ _id: req.params.id })
						.then(() => {
							res.status(200).json({ message: "Objet supprimé !" });
						})
						.catch(error =>
							res.status(401).json({ message: "Objet non supprimé !" + error })
						);
				});
			}
		})
		.catch(error => {
			res.status(500).json({ message: "Error : " + error });
		});
};

exports.getAllPosts = (req, res, next) => {
	Post.find()
		.then(posts => {
			res.status(200).json(posts);
		})
		.catch(error => {
			res.status(400).json({
				error: error
			});
		});
};
const postAlreadyLiked = (postId, userId) => {
	return Post.find({
		usersLiked: { $elemMatch: { $eq: userId } }, // in recherche dans un array
		_id: postId
	});
};

const postAlreadyDisliked = (postId, userId) => {
	return Post.find({
		usersDisliked: { $elemMatch: { $eq: userId } }, // in recherche dans un array
		_id: postId
	});
};

exports.likePost = async (req, res, next) => {
	console.log(req.body);
	//verifier si le variable like existe and === 1 ( like )
	if (req.body.like && req.body.like === 1) {
		console.log(req.body);
		let check = await postAlreadyLiked(req.params.id, req.auth.userId); //verifier si user liked Post
		console.log(check);
		if (check.length === 0) {
			// si user n'exsite pas il va ajouter un like
			let res0 = addLike(req.params.id, req.auth.userId);
			res.status(200).json(res0); // il va executer la fonction addlikeet retourner leur resultat a l'api
		} else {
			console.log("like existe");
			res.status(201).json({ like: "already liked" });
		}
		//verifier si le variable like existe and === -1 ( dislike )
	} else if (req.body.like && req.body.like === -1) {
		let check = await postAlreadyDisliked(req.params.id, req.auth.userId);
		if (check.length === 0) {
			res.status(200).json(addDislike(req.params.id, req.auth.userId));
		} else {
			console.log("user dislike existe");
			res.status(201).json({ like: "already disliked" });
		}

		//if like/dislike enlever
	} else {
		let checkl = await postAlreadyLiked(req.params.id, req.auth.userId);
		if (checkl.length !== 0) {
			let res1 = deleteLike(req.params.id, req.auth.userId);
			res.status(200).json(res1);
		}

		let checkd = await postAlreadyDisliked(req.params.id, req.auth.userId);
		if (checkd.length !== 0) {
			let res2 = deleteDislike(req.params.id, req.auth.userId);
			res.status(200).json(res2);
		}
	}
};

const addLike = (postId, userId) => {
	Post.updateOne(
		{ _id: postId },
		{
			$push: {
				usersLiked: userId
			},
			$inc: {
				likes: 1
			}
		}
	)
		.then(response => {
			return response;
		})
		.catch(error => {
			return false;
		});
};
const addDislike = (postId, userId) => {
	Post.updateOne(
		{ _id: postId },
		{
			$push: {
				usersDisliked: userId
			},
			$inc: {
				dislikes: 1
			}
		}
	)
		.then(response => {
			return response;
		})
		.catch(error => {
			return false;
		});
};
const deleteLike = (postId, userId) => {
	Post.updateOne(
		{ _id: postId },
		{
			$pull: {
				usersLiked: userId
			},
			$inc: {
				likes: -1
			}
		}
	)
		.then(response => {
			return response;
		})
		.catch(error => {
			return false;
		});
};
const deleteDislike = (postId, userId) => {
	Post.updateOne(
		{ _id: postId },
		{
			$pull: {
				usersDisliked: userId
			},
			$inc: {
				dislikes: -1
			}
		}
	)
		.then(response => {
			return response;
		})
		.catch(error => {
			return false;
		});
};
