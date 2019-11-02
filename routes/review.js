const express = require("express"),
   router = express.Router({
      mergeParams: true
   }),
   Campground = require("../models/campground"),
   Review = require("../models/review"),
   middleware = require("../middleware/index");

router.get("/", function (req, res) {
   Campground.findOne({ slug: req.params.slug }).populate({
      path: "reviews",
      options: {
         sort: {
            createdAt: -1
         }
      }
   }).exec(function (err, campground) {
      if (err || !campground) {
         req.flash("error", err.message);
         return res.redirect("back");
      }
      res.render("reviews/index", {
         campground: campground
      });
   })
});

router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
   Campground.findOne({ slug: req.params.slug }, function (err, campground) {
      if (err || !campground) {
         req.flash("error", err.message);
         res.redirect("back");
      } else {
         res.render("reviews/new", {
            campground: campground
         });
      }
   })
});

router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, async function (req, res) {
   try {
      req.body.review.rating = Number(req.body.review.rating);
      //console.log(req.body.review);
      let campground = await Campground.findOne({ slug: req.params.slug }).populate("reviews").exec();
      let review = await Review.create(req.body.review);
      review.author.id = req.user._id;
      review.author.username = req.user.username;
      review.campground = campground;
      await review.save();
      await campground.reviews.push(review);
      //console.log(calculateAvg(campground.reviews));
      campground.rating = calculateAvg(campground.reviews);
      await campground.save();
      req.flash("success", "Successfully added a review");
      res.redirect("/campgrounds/" + req.params.slug);
   } catch (err) {
      console.log(err);
   }
});

router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
   Review.findById(req.params.review_id, function (err, review) {
      if (err || !review) {
         req.flash("error", err.message);
         res.redirect("back");
      } else {
         res.render("reviews/edit", {
            campgroundSlug: req.params.slug,
            review: review
         });
      }
   });
});

router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
   Review.findByIdAndUpdate(req.params.review_id, req.body.review, {
      new: true
   }, function (err, review) {
      if (err) {
         req.flash("error", err.message);
         return res.redirect("back");
      }
      Campground.findOne({ slug: req.params.slug }).populate("reviews").exec(function (err, campground) {
         if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
         }
         campground.rating = calculateAvg(campground.reviews);
         campground.save();
         req.flash("success", "Successfully edited review");
         res.redirect(`/campgrounds/${campground.slug}`);
      });
   });
});

router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
   Review.findByIdAndRemove(req.params.review_id, function (err) {
      if (err) {
         req.flash("error", err.message);
         return res.redirect("back");
      }
      Campground.findOneAndUpdate(req.params.slug, {
         $pull: {
            reviews: req.params.review_id
         }
      }, {
         new: true
      }).populate("reviews").exec(function (err, campground) {
         if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
         }
         campground.rating = calculateAvg(campground.reviews);
         campground.save();
         req.flash("success", "Successfully deleted review");
         res.redirect(`/campgrounds/${campground.slug}`);
      });
   });
});

function calculateAvg(reviews) {
   if (!reviews || reviews.length === 0) {
      return 0;
   }
   let sum = 0;
   reviews.forEach(function (review) {
      sum += review.rating;
   });
   return sum / reviews.length;
}

module.exports = router;