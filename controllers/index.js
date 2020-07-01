const User = require("../models/user"),
   Campground = require("../models/campground"),
   passport = require("passport");

module.exports = {

   getLanding(req, res) {
      res.render("landing");
   },

   getRegister(req, res) {
      res.render("register");
   },

   async postRegister(req, res, next) {
      try {
         let newUser = {
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
         }
         if (req.body.secretCode === process.env.SECRET_CODE) {
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
      } catch (err) {
         console.log(err);
         req.flash("error",err.message);
         res.redirect("back");
      }
   },

   getLogin(req, res) {
      res.render("login");
   },


   postLogin(req, res, next) {
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
   },

   logout(req, res) {
      req.logout();
      req.flash("success", "Logged You out successfully!");
      res.redirect("/campgrounds");
   },

   async userHome(req, res) {
      try {
         let user = await User.findById(req.params.id).populate("followers bookedCampgrounds").exec();
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
   }
}