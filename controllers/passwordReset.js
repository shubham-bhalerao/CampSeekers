const User = require("../models/user");

//Password Reset 
const async = require("async"),
   nodemailer = require("nodemailer"),
   crypto = require("crypto");

module.exports = {

   getForgot(req, res) {
      res.render("forgot");
   },

   postForgot(req, res, next) {
      async.waterfall([
         function (done) {
            crypto.randomBytes(20, function (err, buff) {
               var token = buff.toString("hex");
               done(err, token);
            });
         },
         function (token, done) {
            User.findOne({
               email: req.body.email
            }, function (err, user) {
               if (!user) {
                  req.flash("error", "User with given email doesnt exist");
                  return res.redirect("/forgot");
               }
               user.resetPasswordToken = token;
               user.resetPasswordExpires = Date.now() + 3600000; //1 hour
               user.save(function (err) {
                  done(err, token, user);
               });
            });
         },
         function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({
               service: "Gmail",
               auth: {
                  user: process.env.GMAIL,
                  pass: process.env.GMAILPW
               }
            });
            var mailOptions = {
               to: user.email,
               from: process.env.GMAIL,
               subject: "CampSeekers Password Reset",
               text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            }
            smtpTransport.sendMail(mailOptions, function (err) {
               req.flash("success", `An e-mail has been sent to ${user.email} with further instructions`);
               res.redirect("/campgrounds");
               done(err, "done");
            })
         }
      ], function (err) {
         if (err) {
            return next(err);
         }
         res.redirect("/forgot");
      });
   },

   async getReset(req, res) {
      try {
         let user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
               $gt: Date.now()
            }
         });
         if (!user) {
            req.flash("error", "Password Token is invalid or has expired");
            return res.redirect("/forgot");
         }
         res.render("reset", {
            token: req.params.token,
            user: user
         });

      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   postReset(req, res) {
      async.waterfall([
         function (done) {
            User.findOne({
               resetPasswordToken: req.params.token,
               resetPasswordExpires: {
                  $gt: Date.now()
               }
            }, function (err, user) {
               if (err || !user) {
                  req.flash("error", "Password token is invalid or has expired");
                  return res.redirect("back");
               }
               if (req.body.password === req.body.confirm) {
                  user.setPassword(req.body.password, function (err) {
                     user.resetPasswordExpires = undefined;
                     user.resetPasswordToken = undefined;
                     user.save(function (err) {
                        req.logIn(user, function (err) {
                           done(err, user);
                        });
                     });
                  });
               } else {
                  req.flash("error", "Passwords do not match");
                  return res.redirect("back");
               }
            });
         },
         function (user, done) {
            var smtpTransport = nodemailer.createTransport({
               service: "Gmail",
               auth: {
                  user: process.env.GMAIL,
                  pass: process.env.GMAILPW
               }
            });
            var mailOptions = {
               to: user.email,
               from: process.env.GMAIL,
               subject: "CampSeekers Password Succesfully Changed",
               text: "This is a confirmation message that password for your acoount " + user.email + " has just been changed!"
            };
            smtpTransport.sendMail(mailOptions, function (err) {
               req.flash("success", "Your password has been changed");
               done(err);
            })
         }
      ], function (err) {
         res.redirect("/campgrounds");
      });
   }

}