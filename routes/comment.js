const express = require("express"),
   middleware = require("../middleware/index"),
   router = express.Router({
      mergeParams: true
   });

const {
   newCommentForm,
   createComment,
   editCommentForm,
   updateComment,
   deleteComment
} = require("../controllers/comment");

router.get("/new", middleware.isLoggedIn, newCommentForm);

router.post("/", middleware.isLoggedIn, createComment);

router.get("/:comment_id/edit", middleware.commentOwnership, editCommentForm);

router.put("/:comment_id", middleware.commentOwnership, updateComment);

router.delete("/:comment_id", middleware.commentOwnership, deleteComment);

module.exports = router;