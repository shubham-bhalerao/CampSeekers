var Comment = require("../models/comment"),
    Campground = require("../models/campground"),
    express = require("express"),
    User = require("../models/user"),
    Notification = require("../models/notification"),
    middleware = require("../middleware/index"),
    router = express.Router({
        mergeParams: true
    });

router.get("/new", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
        } else {
            res.render("comment/new", {
                campground: campground
            });
        }
    });
});

router.post("/", middleware.isLoggedIn, async function (req, res) {
    try {
        let campground = await Campground.findById(req.params.id);
        let comment = await Comment.create(req.body.comment);
        comment.author.username = req.user.username;
        comment.author.id = req.user._id;
        comment.save();
        campground.comments.push(comment);
        campground.save();
        //Create a Notification
        let user = await User.findById(req.user._id).populate("followers").exec();
        let newNotification = {
            user: req.user.username,
            campgroundId: req.params.id,
            createdWhat: "comment"
        }
        for (const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
        }
        req.flash("success", "Successfully created a comment!");
        res.redirect("/campgrounds/" + req.params.id);
    } catch (err) {
        console.log(err);
    }
});

router.get("/:comment_id/edit", middleware.commentOwnership, function (req, res) {
    Comment.findById(req.params.comment_id, function (err, comment) {
        if (err) {
            console.log(err);
        } else {
            res.render("comment/edit", {
                campgroundId: req.params.id,
                comment: comment
            });
        }
    });
});

router.put("/:comment_id", middleware.commentOwnership, function (req, res) {
    Comment.findOneAndUpdate({
        _id: req.params.comment_id
    }, req.body.comment, function (err, comment) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

router.delete("/:comment_id", middleware.commentOwnership, function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
        if (err) {
            console.log(err);
        } else {
            req.flash("success", "Successfully deleted comment!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
});

module.exports = router;