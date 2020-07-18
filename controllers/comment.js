const Comment = require("../models/comment"),
   Campground = require("../models/campground"),
   express = require("express"),
   User = require("../models/user"),
   Notification = require("../models/notification");

module.exports = {
   async newCommentForm(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug });
         if (!campground) return res.redirect("back");
         res.render("comment/new", {
            campground: campground
         });
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async createComment(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug });
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
            campgroundSlug: req.params.slug,
            createdWhat: "comment"
         }
         for (const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
         }
         req.flash("success", "Successfully created a comment!");
         res.redirect("/campsites/" + req.params.slug);
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async editCommentForm(req, res) {
      try {
         let comment = await Comment.findById(req.params.comment_id);
         res.render("comment/edit", {
            campgroundSlug: req.params.slug,
            comment: comment
         });
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async updateComment(req, res) {
      try {
         let comment = await Comment.findOneAndUpdate({
            _id: req.params.comment_id
         }, req.body.comment);
         req.flash("success", "Successfully updated comment");
         res.redirect("/campsites/" + req.params.slug);
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async deleteComment(req, res) {
      try {
         await Comment.findByIdAndRemove(req.params.comment_id);
         req.flash("success", "Successfully deleted comment!");
         res.redirect("/campsites/" + req.params.slug);
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   }
}