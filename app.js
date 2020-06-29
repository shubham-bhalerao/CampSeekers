require('dotenv').config();
const express = require("express"),
   app = express(),
   bodyParser = require("body-parser"),
   mongoose = require("mongoose"),
   Campground = require("./models/campground"),
   Comment = require("./models/comment"),
   passport = require("passport"),
   LocalStrategy = require("passport-local"),
   Notification = require("./models/notification"),
   methodOverride = require("method-override"),
   passportLocalMongoose = require("passport-local-mongoose"),
   User = require("./models/user"),
   flash = require("connect-flash"),
   moment = require("moment"),
   keyPublishable = process.env.PUBLISHABLE_KEY,
   keySecret = process.env.SECRET_KEY,
   stripe = require("stripe")(keySecret);

//Requiring Routes
const commentRoutes = require("./routes/comment"),
   campgroundRoutes = require("./routes/campground"),
   reviewRoutes = require("./routes/review"),
   passwordResetRoutes = require("./routes/passwordReset"),
   indexRoutes = require("./routes/index"),
   notificationRoutes = require("./routes/notification"),
   stripeRoutes = require("./routes/stripe");


//mongodb config
mongoose.connect("mongodb://localhost:27017/camp-seekers", {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   useCreateIndex: true //these are to avoid warnings
});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

app.use(require("express-session")({
   secret: "Hello Shubham here",
   resave: false,
   saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function (req, res, next) {
   res.locals.currentUser = req.user;
   //Notifications
   if (req.user) {
      try {
         let user = await User.findById(req.user._id).populate("notifications", null, {
            isRead: false
         }).exec();
         res.locals.notifications = user.notifications.reverse();
      } catch (err) {
         console.log(err);
      }
   }
   res.locals.success = req.flash("success");
   res.locals.error = req.flash("error");
   res.locals.moment = moment; //Moment Js Time
   next();
});

app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:slug/comments", commentRoutes);
app.use("/campgrounds/:slug/reviews", reviewRoutes);
app.use(notificationRoutes);
app.use(passwordResetRoutes);
app.use(stripeRoutes);
app.use(indexRoutes);

const port = process.env.PORT || 3000;
app.listen(port, function () {
   console.log(`CampSeekers Server started on port ${port}`);
});