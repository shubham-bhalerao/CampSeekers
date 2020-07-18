var middleware = {};
var Campground = require("../models/campground"),
   Comment = require("../models/comment"),
   Review = require("../models/review");

middleware.isLoggedIn = function (req, res, next) {
   if (req.isAuthenticated()) {
      next();
   } else {
      //For redirecting to Previous page
      req.session.redirectTo = req.originalUrl;
      req.flash("error", "You need to login first!");
      res.redirect("/login");
   }
}

middleware.campgroundOwnership = function (req, res, next) {
   if (req.isAuthenticated()) {
      Campground.findOne({ slug: req.params.slug }, function (err, campground) {
         if (err || !campground) {
            console.log("Error", campground);
         } else {
            if (campground.author.id.equals(req.user._id) || (req.user && req.user.isAdmin)) {
               next();
            } else {
               res.redirect("back");
            }
         }
      });
   } else {
      res.redirect("back");
   }
}

middleware.commentOwnership = function (req, res, next) {
   if (req.isAuthenticated()) {
      Comment.findById(req.params.comment_id, function (err, comment) {
         if (err) {
            console.log(err);
         } else {
            if (comment.author.id.equals(req.user._id) || (req.user && req.user.isAdmin)) {
               next();
            } else {
               res.redirect("back");
            }
         }
      });
   } else {
      res.redirect("back");
   }
}

//Review Middleware
middleware.checkReviewOwnership = function (req, res, next) {
   if (req.isAuthenticated()) {
      Review.findById(req.params.review_id, function (err, foundReview) {
         if (err || !foundReview) {
            res.redirect("back");
         } else {
            if (foundReview.author.id.equals(req.user._id) || (req.user && req.user.isAdmin)) {
               next();
            } else {
               req.flash("error", "You don't have permission to do that");
               res.redirect("back");
            }
         }
      });
   } else {
      req.flash("error", "You need to be logged in to do that");
      res.redirect("back");
   }
}

middleware.checkReviewExistence = function (req, res, next) {
   if (req.isAuthenticated()) {
      Campground.findOne({ slug: req.params.slug }).populate("reviews").exec(function (err, foundCampground) {
         if (err || !foundCampground) {
            req.flash("error", "Campground not found.");
            res.redirect("back");
         } else {
            // check if req.user._id exists in foundCampground.reviews
            var foundUserReview = foundCampground.reviews.some(function (review) {
               return review.author.id.equals(req.user._id);
            });
            if (foundUserReview) {
               req.flash("error", "You already wrote a review.");
               return res.redirect("/campsites/" + foundCampground._id);
            }
            // if the review was not found, go to the next middleware
            next();
         }
      });
   } else {
      req.flash("error", "You need to login first.");
      res.redirect("back");
   }
};

module.exports = middleware;