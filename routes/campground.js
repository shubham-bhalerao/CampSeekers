const express = require("express"),
   router = express.Router(),
   Campground = require("../models/campground"),
   Comment = require("../models/comment"),
   User = require("../models/user"),
   Notification = require("../models/notification"),
   keyPublishable = process.env.PUBLISHABLE_KEY,
   middleware = require("../middleware/index");

// MapBox
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding"),
   geocodingClient = mbxGeocoding({
      accessToken: process.env.MAPBOX
   });

//Index Route - Get All Campgrounds
router.get("/", function (req, res) {
   //Fuzzy Search
   if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      Campground.paginate({
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
      }, function (err, foundCampgrounds) {
         if (err) {
            console.log(err);
         } else {
            if (foundCampgrounds.length < 1) {
               req.flash("error", "Oops! No Campgrounds found!")
               return res.redirect("/campgrounds");
            }
            foundCampgrounds.page = Number(foundCampgrounds.page);
            res.render("campground/index", {
               campgrounds: foundCampgrounds
            });
         }
      });
   } else {
      Campground.paginate({}, {
         page: req.query.page || 1,
         limit: 9
      }, function (err, allCampgrounds) {
         if (err) {
            console.log(err);
         } else {
            allCampgrounds.page = Number(allCampgrounds.page);
            res.render("campground/index", {
               campgrounds: allCampgrounds
            });
         }
      });
   }
});

// New Route
router.get("/new", middleware.isLoggedIn, function (req, res) {
   res.render("campground/new");
});

//Create Post
router.post("/", middleware.isLoggedIn, async function (req, res) {
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
         campgroundId: campground._id,
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
});

//Show Page
router.get("/:id", function (req, res) {
   Campground.findById(req.params.id).populate("comments likes").populate({
      path: "reviews",
      options: {
         sort: {
            createdAt: -1 //latest first
         }
      }
   }).exec(async function (err, campground) {
      if (err || !campground) {
         console.log(err);
         res.redirect("back");
      } else {
         let hasBooked = false;
         let amount = campground.price * 100;
         if (req.user) {
            let user = await User.findById(req.user._id);
            hasBooked = user.bookedCampgrounds.some(function (camp) {
               return camp._id.equals(campground._id);
            });
         }
         res.render("campground/show", {
            campground,
            keyPublishable,
            hasBooked,
            amount
         });
      }
   });
});

router.get("/:id/edit", middleware.campgroundOwnership, function (req, res) {
   Campground.findById(req.params.id, function (err, campground) {
      if (err || !campground) {
         console.log(err);
      } else {
         res.render("campground/edit", {
            campground: campground
         });
      }
   });
});

router.put("/:id", middleware.campgroundOwnership, async function (req, res) {
   delete req.body.campground.rating;
   try {
      let campground = await Campground.findById(req.params.id);
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
      campground.save();
      req.flash("success", "Successfully Updated Campground!");
      res.redirect(`/campgrounds/${campground._id}`);
   } catch (err) {
      req.flash("error", err.message);
      res.redirect("back");
   }
});

//Updated To delete associated comments and reviews
router.delete("/:id", middleware.campgroundOwnership, function (req, res) {
   Campground.findById(req.params.id, function (err, campground) {
      if (err || !campground) {
         req.flash("error", err.message);
         return res.redirect("/campgrounds");
      }
      Comment.remove({
         "_id": {
            $in: campground.comments
         }
      }, function (err) {
         if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
         }
      });
      Review.remove({
         "_id": {
            $in: campground.reviews
         }
      }, function (err) {
         if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
         }
      });
      campground.remove();
   });
});

// Campground Like Route
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
   Campground.findById(req.params.id, function (err, foundCampground) {
      if (err) {
         console.log(err);
         return res.redirect("/campgrounds");
      }

      // check if req.user._id exists in foundCampground.likes
      var foundUserLike = foundCampground.likes.some(function (like) {
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

      foundCampground.save(function (err) {
         if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
         }
         req.flash("success", msg);
         return res.redirect("/campgrounds/" + foundCampground._id);
      });
   });
});

function escapeRegex(text) {
   return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;