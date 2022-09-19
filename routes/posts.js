const express = require("express");
const router = express.Router();

const postCtrl = require("../controllers/posts");
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");

router.get("/", postCtrl.getAllPosts);
router.post("/", auth, multer, postCtrl.createPost);
router.get("/:id", auth, postCtrl.getOnePost);
router.put("/:id", auth, multer, postCtrl.modifyPost);
router.post("/:id/like", auth, postCtrl.LikePost);
router.delete("/:id", auth, postCtrl.deletePost);

module.exports = router;
