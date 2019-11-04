const Campground = require("../models/campground"),
   Comment = require("../models/comment"),
   User = require("../models/user"),
   Review = require("../models/review"),
   Notification = require("../models/notification"),
   keyPublishable = process.env.PUBLISHABLE_KEY;

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding"),
   geocodingClient = mbxGeocoding({
      accessToken: process.env.MAPBOX
   });

module.exports = {

   async getCampgrounds(req, res) {
      try {
         //Fuzzy Search
         if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            let foundCampgrounds = await Campground.paginate({
               $or: [{
                  "title": regex,
               }, {
                  "author.username": regex
               }, {
                  "location": regex
               }]
            }, {
               page: req.query.page || 1,
               limit: 9,
            });
            if (foundCampgrounds.length < 1) {
               req.flash("error", "Oops! No Campgrounds found!")
               return res.redirect("/campgrounds");
            }
            foundCampgrounds.page = Number(foundCampgrounds.page);
            res.render("campground/index", {
               campgrounds: foundCampgrounds
            });
         } else {
            let allCampgrounds = await Campground.paginate({}, {
               page: req.query.page || 1,
               limit: 9
            });
            allCampgrounds.page = Number(allCampgrounds.page);
            res.render("campground/index", {
               campgrounds: allCampgrounds
            });
         }
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   newCampgroundForm(req, res) {
      res.render("campground/new");
   },

   async createCampground(req, res) {
      try {
         let campground = await Campground.create(req.body.campground);
         campground.author.username = req.user.username;
         campground.author.id = req.user._id;
         // MapBox Forward Geocoding i.e Location => Coordinates
         let response = await geocodingClient.forwardGeocode({
            query: campground.location,
            limit: 1
         }).send();
         campground.coordinates = response.body.features[0].geometry.coordinates;
         campground.save();
         let user = await User.findById(req.user._id).populate("followers").exec();

         let newNotification = {
            user: req.user.username,
            campgroundSlug: campground.slug,
            createdWhat: "campground"
         }
         for (const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
         }
         req.flash("success", "Successfully created campground!");
         res.redirect("/campgrounds");
      } catch (err) {
         console.log(err.message);
      }
   },

   async showCampground(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug }).populate("comments likes").populate({
            path: "reviews",
            options: {
               sort: {
                  createdAt: -1 //latest first
               }
            }
         }).exec();
         if (!campground) return res.redirect("back");
         let hasBooked = false;
         let amount = campground.price * 100;
         if (req.user) {
            let user = await User.findById(req.user._id);
            hasBooked = user.bookedCampgrounds.some(function (camp) {
               return camp._id.equals(campground._id);
            });
         }
         console.log(campground);
         res.render("campground/show", {
            campground,
            keyPublishable,
            hasBooked,
            amount
         });
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async editCampgroundForm(req, res) {
      let campground = await Campground.findOne({ slug: req.params.slug });
      if (!campground) return res.redirect("back");
      res.render("campground/edit", {
         campground: campground
      });
   },

   async updateCampground(req, res) {
      try {
         delete req.body.campground.rating;
         let campground = await Campground.findOne({ slug: req.params.slug });
         if (req.body.campground.location !== campground.location) {
            let response = await geocodingClient.forwardGeocode({
               query: req.body.campground.location,
               limit: 1
            }).send();
            campground.coordinates = response.body.features[0].geometry.coordinates;
            campground.location = req.body.campground.location;
         }
         campground.title = req.body.campground.title;
         campground.price = req.body.campground.price;
         campground.img = req.body.campground.img;
         campground.content = req.body.campground.content;
         await campground.save();
         req.flash("success", "Successfully Updated Campground!");
         res.redirect(`/campgrounds/${campground.slug}`);
      } catch (err) {
         req.flash("error", err.message);
         res.redirect("back");
      }
   },

   async deleteCampground(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug });
         if (!campground) return res.redirect("/campgrounds");
         await Comment.remove({
            "_id": {
               $in: campground.comments
            }
         });
         await Review.remove({
            "_id": {
               $in: campground.reviews
            }
         });
         await campground.remove();
         req.flash("success", "Successfully Deleted Campground");
         res.redirect("/campgrounds");
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async postLike(req, res) {
      try {
         let foundCampground = await Campground.findOne({ slug: req.params.slug });
         // check if req.user._id exists in foundCampground.likes
         let foundUserLike = foundCampground.likes.some(function (like) {
            return like.equals(req.user._id);   // === issue is there
         });
         let msg;
         if (foundUserLike) {
            // user already liked, removing like
            msg = "Campground liked removed";
            foundCampground.likes.pull(req.user._id);
         } else {
            // adding the new user like
            msg = "Campground liked";
            foundCampground.likes.push(req.user);
         }
         await foundCampground.save();
         req.flash("success", msg);
         return res.redirect("/campgrounds/" + foundCampground.slug);
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   }
}

function escapeRegex(text) {
   return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};