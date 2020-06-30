const Campground = require("../models/campground"),
   User = require("../models/user"),
   nodemailer = require("nodemailer"),
   keySecret = process.env.SECRET_KEY,
   stripe = require("stripe")(keySecret);

module.exports = {
   async postPayment(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug });
         let user = await User.findById(req.user._id);
         if(req.body.stripeEmail!=user.email){
            req.flash("error","Email Incorrect");
            return res.redirect("back");
         }
         user.bookedCampgrounds.push(campground._id);
         user.save();
         stripe.customers
            .create({
               email: req.body.stripeEmail,
               source: req.body.stripeToken
            })
            .then(customer => {
               stripe.charges.create({
                  amount: campground.price*100,
                  description: campground.title,
                  currency: "inr",
                  customer: customer.id
               });
            })
            .then(function(charge) {
               req.flash("success", "Successfully Booked Campsite. Email regarding booking has been sent");
               return res.redirect(`/campgrounds/${campground.slug}`);
            });
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
               subject: `CampSeekers Booking for ${campground.title} Successful`,
               html: `<h1>Hi ${user.firstName} ${user.lastName},</h1>
                      <h2>Thank You for your payment for the ${campground.title}. The total amount paid is INR ${campground.price}.</h2>
                      <hr>
                      <p>We hope you have a wonderful time enjoying our campsite!</p>
                      <hr>
                      <p>We hope to serve you again!</p>
                      <h2>Thank You!</h2>`
            }
            await smtpTransport.sendMail(mailOptions);
            
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   }
};
