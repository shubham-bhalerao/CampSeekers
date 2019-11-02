const express = require("express"),
   router = express.Router(),
   User = require("../models/user"),
   Campground = require("../models/campground"),
   Notification = require("../models/notification"),
   passport = require("passport"),
   middleware = require("../middleware/index"),
   fetch = require("node-fetch");

router.get("/", function (req, res) {
   res.render("landing");
});


router.get("/register", function (req, res) {
   res.render("register");
});

router.post("/register", function (req, res) {
   let newUser = {
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email
   }
   if (req.body.secretCode === "secretCode123") {
      newUser.isAdmin = true;
   }
   User.register(newUser, req.body.password, function (err, user) {
      if (err) {
         req.flash("error", err.message);
         res.redirect("back");
      } else {
         passport.authenticate("local")(req, res, function () {
            if (user.isAdmin) {
               req.flash("success", "Welcome To YelpCamp, " + user.username + "! You are an Admin!");
               res.redirect("/campgrounds");
            } else {
               req.flash("success", "Welcome To YelpCamp, " + user.username + "!");
               res.redirect("/campgrounds");
            }
         });
      }
   });
});

router.get("/login", function (req, res) {
   res.render("login");
});

router.post("/login", function (req, res, next) {
   passport.authenticate("local", function (err, user, info) {
      //user is true if correctly logged in
      if (err) {
         return next(err);
      }
      if (!user) {
         req.flash("error", info.message);
         return res.redirect("back");
      }
      req.logIn(user, function (err) {
         if (err) {
            return next(err);
         }
         let redirectTo = req.session.redirectTo ? req.session.redirectTo : "/campgrounds";
         delete req.session.redirectTo;
         req.flash("success", `Welcome back ${user.username}`);
         res.redirect(redirectTo);
      });
   })(req, res, next);
});

router.get("/logout", function (req, res) {
   req.logout();
   req.flash("success", "Logged You out successfully!");
   res.redirect("/campgrounds");
});

//===============
//User routes
//===============

router.get("/users/:id", async function (req, res) {
   try {
      let user = await User.findById(req.params.id).populate("followers").populate("bookedCampgrounds").exec();
      let campgrounds = await Campground.find({
         "author.id": user._id
      });
      let doesFollow = false;
      if (req.user) {
         for (const follower of user.followers) {
            if (follower._id.equals(req.user._id)) {
               doesFollow = true;
               break;
            }
         }
      }
      res.render("user", {
         user,
         campgrounds,
         bookedCampgrounds: user.bookedCampgrounds,
         doesFollow
      });
   } catch (err) {
      req.flash("error", err.message);
      res.redirect("back");
   }
});

//Testing apis
// router.get("/fetch", function (req, res) {
//     let search = "&search=1";
//     let baseUrl = "https://swapi.co/api/films/?format=json"
//     let url = baseUrl + search;
//     fetch("https://icanhazdadjoke.com/")
//         .then(respone => respone.json())
//         .then(function (data) {
//             console.log(data);
//             res.send(data);
//         })
//         .catch(err => console.log(err));
// });


module.exports = router;