const express = require("express"),
    router = express.Router(),
    User = require("../models/user"),
    Notification = require("../models/notification"),
    middleware = require("../middleware/index");

//=============
//Notification Routes
//=============

router.get("/follow/:id", middleware.isLoggedIn, async function (req, res) {
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
});

router.get("/notifications", middleware.isLoggedIn, async function (req, res) {
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
            notifications: allNotifications
        });
    } catch (err) {
        req.flash("error", "Something went wrong");
        res.redirect("back");
    }
});


router.get("/notifications/:id", middleware.isLoggedIn, async function (req, res) {
    try {
        let notification = await Notification.findById(req.params.id);
        notification.isRead = true;
        notification.save();
        res.redirect(`/campgrounds/${notification.campgroundId}`);
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back");
    }
});

//Unfollow Person
router.get("/unfollow/:id", async function (req, res) {
    try {
        let user = await User.findById(req.params.id);
        var index = user.followers.indexOf(req.user._id);
        console.log(user.followers);
        if (index > -1) {
            user.followers.splice(index, 1);
        }
        console.log(user.followers);
        user.save();
        req.flash("success", `Successfully Unfollowed ${user.username}`);
        res.redirect("/campgrounds");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("back");
    }
});
module.exports = router;