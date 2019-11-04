const Campground = require("../models/campground"),
   Review = require("../models/review");

module.exports = {

   async getAllReviews(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug }).populate({
            path: "reviews",
            options: {
               sort: {
                  createdAt: -1
               }
            }
         }).exec();
         res.render("reviews/index", {
            campground: campground
         });
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async getReviewForm(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug });
         if (!campground) {
            req.flash("error", "No campground found");
            res.redirect("back");
         }
         res.render("reviews/new", {
            campground: campground
         });
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async postReview(req, res) {
      try {
         req.body.review.rating = Number(req.body.review.rating);
         let campground = await Campground.findOne({ slug: req.params.slug }).populate("reviews").exec();
         let review = await Review.create(req.body.review);
         review.author.id = req.user._id;
         review.author.username = req.user.username;
         review.campground = campground;
         await review.save();
         campground.reviews.push(review);
         campground.rating = calculateAvg(campground.reviews);
         await campground.save();
         req.flash("success", "Successfully added a review");
         res.redirect("/campgrounds/" + req.params.slug);
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async editReviewForm(req, res) {
      try {
         let review = await Review.findById(req.params.review_id);
         if (!review) {
            req.flash("error", "No review found");
            res.redirect("back");
         }
         res.render("reviews/edit", {
            campgroundSlug: req.params.slug,
            review: review
         });
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async updateReview(req, res) {
      try {
         let review = await Review.findByIdAndUpdate(req.params.review_id, req.body.review, {
            new: true
         });
         let campground = await Campground.findOne({ slug: req.params.slug }).populate("reviews").exec();
         campground.rating = calculateAvg(campground.reviews);
         await campground.save();
         req.flash("success", "Successfully edited review");
         res.redirect(`/campgrounds/${campground.slug}`);
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async deleteReview(req, res) {
      try {
         await Review.findByIdAndRemove(req.params.review_id);
         let campground = await Campground.findOneAndUpdate(req.params.slug, {
            $pull: {
               reviews: req.params.review_id
            }
         }, {
            new: true
         }).populate("reviews").exec();
         campground.rating = calculateAvg(campground.reviews);
         campground.save();
         req.flash("success", "Successfully deleted review");
         res.redirect(`/campgrounds/${campground.slug}`);
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   }
}

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