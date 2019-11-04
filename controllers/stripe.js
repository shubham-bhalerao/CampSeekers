const Campground = require("../models/campground"),
   User = require("../models/user"),
   keySecret = process.env.SECRET_KEY,
   stripe = require("stripe")(keySecret);

module.exports = {
   async postPayment(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug });
         let user = await User.findById(req.user._id);
         user.bookedCampgrounds.push(campground._id);
         user.save();
         stripe.customers
            .create({
               email: req.body.stripeEmail,
               source: req.body.stripeToken
            })
            .then(customer => {
               stripe.charges.create({
                  amount: campground.price * 100,
                  description: campground.title,
                  currency: "usd",
                  customer: customer.id
               });
            })
            .then(function(charge) {
               req.flash("success", "Successfully Booked Campground");
               return res.redirect(`/campgrounds/${campground.slug}`);
            });
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   }
};
