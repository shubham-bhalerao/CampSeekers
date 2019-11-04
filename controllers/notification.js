const User = require("../models/user"),
   Notification = require("../models/notification");

module.exports = {
   async follow(req, res) {
      try {
         let user = await User.findById(req.params.id);
         user.followers.push(req.user._id);
         user.save();
         req.flash("success", `Successfully followed ${user.username}!`);
         res.redirect("/campgrounds");
      } catch (err) {
         req.flash("error", "Something Went Wrong");
         res.redirect("back");
      }
   },

   async allNotifications(req, res) {
      try {
         let user = await User.findById(req.user._id).populate({
            path: "notifications",
            options: {
               sort: {
                  "_id": -1
               }
            }
         }).exec();
         let allNotifications = user.notifications;
         res.render("notifications/index", {
            allNotifications: allNotifications
         });
      } catch (err) {
         req.flash("error", "Something went wrong");
         res.redirect("back");
      }
   },

   async showNotification(req, res) {
      try {
         let notification = await Notification.findById(req.params.id);
         notification.isRead = true;
         notification.save();
         res.redirect(`/campgrounds/${notification.campgroundSlug}`);
      } catch (err) {
         req.flash("error", err.message);
         res.redirect("back");
      }
   },

   async unfollow(req, res) {
      try {
         let user = await User.findById(req.params.id);
         var index = user.followers.indexOf(req.user._id);
         if (index > -1) {
            user.followers.splice(index, 1);
         }
         user.save();
         req.flash("success", `Successfully Unfollowed ${user.username}`);
         res.redirect("/campgrounds");
      } catch (err) {
         req.flash("error", err.message);
         res.redirect("back");
      }
   }
}