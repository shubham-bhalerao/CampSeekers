const express = require("express"),
   Campground = require("../models/campground"),
   User = require("../models/user"),
   keySecret = process.env.SECRET_KEY,
   stripe = require("stripe")(keySecret),
   keyPublishable = process.env.PUBLISHABLE_KEY,
   middleware = require("../middleware"),
   router = express.Router();

router.post("/charge/:id", middleware.isLoggedIn, async function (req, res) {
   let campground = await Campground.findOne({ slug: req.params.slug });
   let user = await User.findById(req.user._id);
   user.bookedCampgrounds.push(campground._id);
   user.save();
   stripe.customers.create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken
   })
      .then(customer => {
         stripe.charges.create({
            amount: campground.price * 100,
            description: campground.title,
            currency: "usd",
            customer: customer.id
         })
      })
      .then(function (charge) {
         req.flash("success", "Successfully Booked Campground");
         return res.redirect(`/campgrounds/${campground._id}`);
      });
});

module.exports = router;