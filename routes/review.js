const express = require("express"),
   router = express.Router({
      mergeParams: true
   }),
   middleware = require("../middleware/index");

const {
   getAllReviews,
   getReviewForm,
   postReview,
   editReviewForm,
   updateReview,
   deleteReview } = require("../controllers/review");

router.get("/", getAllReviews);

router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, getReviewForm);

router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, postReview);

router.get("/:review_id/edit", middleware.checkReviewOwnership, editReviewForm);

router.put("/:review_id", middleware.checkReviewOwnership, updateReview);

router.delete("/:review_id", middleware.checkReviewOwnership, deleteReview);

module.exports = router;