const { response } = require("express");

const Campground = require("../models/campground"),
   Comment = require("../models/comment"),
   User = require("../models/user"),
   Review = require("../models/review"),
   Notification = require("../models/notification"),
   moment =require("moment"),
   fetch = require("node-fetch"),
   apiKey=process.env.WEATHERAPIKEY,
   keyPublishable = process.env.PUBLISHABLE_KEY;

const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding"),
   geocodingClient = mbxGeocoding({
      accessToken: process.env.MAPBOX
   });

module.exports = {

   async getCampgrounds(req, res) {
      try {
         //Fuzzy Search
         if (req.query.search) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            let foundCampgrounds = await Campground.paginate({
               $or: [{
                  "title": regex,
               }, {
                  "author.username": regex
               }, {
                  "location": regex
               }]
            }, {
               page: req.query.page || 1,
               limit: 12,
            });
            if (foundCampgrounds.length < 1) {
               req.flash("error", "Oops! No Campsites found!")
               return res.redirect("/campsites");
            }
            foundCampgrounds.page = Number(foundCampgrounds.page);
            res.render("campground/index", {
               campgrounds: foundCampgrounds
            });
         } else {
            let allCampgrounds = await Campground.paginate({}, {
               page: req.query.page || 1,
               limit: 12
            });
            allCampgrounds.page = Number(allCampgrounds.page);
            res.render("campground/index", {
               campgrounds: allCampgrounds
            });
         }
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   newCampgroundForm(req, res) {
      res.render("campground/new");
   },

   async createCampground(req, res) {
      try {
         let campground = await Campground.create(req.body.campground);
         campground.author.username = req.user.username;
         campground.author.id = req.user._id;
         // MapBox Forward Geocoding i.e Location => Coordinates
         let response = await geocodingClient.forwardGeocode({
            query: campground.location,
            limit: 1
         }).send();
         campground.coordinates = response.body.features[0].geometry.coordinates;
         campground.save();
         let user = await User.findById(req.user._id).populate("followers").exec();

         let newNotification = {
            user: req.user.username,
            campgroundSlug: campground.slug,
            createdWhat: "campsite"
         }
         for (const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
         }
         req.flash("success", "Successfully added campsite!");
         res.redirect("/campsites");
      } catch (err) {
         console.log(err.message);
      }
   },

   async showCampground(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug }).populate("comments likes").populate({
            path: "reviews",
            options: {
               sort: {
                  createdAt: -1 //latest first
               }
            }
         }).exec();
         if (!campground) return res.redirect("back");
         let hasBooked = false;
         let amount = campground.price*100; //stripe uses smallest denomination cents/paise
         if (req.user) {
            let user = await User.findById(req.user._id);
            hasBooked = user.bookedCampgrounds.some(function (camp) {
               return camp._id.equals(campground._id);
            });
         }

         let{current, nextDays} = await getWeatherApiStuff(campground);

         res.render("campground/show", {
            campground,
            keyPublishable,
            hasBooked,
            amount,
            current,
            nextDays
         });

         
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async editCampgroundForm(req, res) {
      let campground = await Campground.findOne({ slug: req.params.slug });
      if (!campground) return res.redirect("back");
      res.render("campground/edit", {
         campground: campground
      });
   },

   async updateCampground(req, res) {
      try {
         delete req.body.campground.rating;
         let campground = await Campground.findOne({ slug: req.params.slug });
         if (req.body.campground.location !== campground.location) {
            let response = await geocodingClient.forwardGeocode({
               query: req.body.campground.location,
               limit: 1
            }).send();
            campground.coordinates = response.body.features[0].geometry.coordinates;
            campground.location = req.body.campground.location;
         }
         campground.title = req.body.campground.title;
         campground.price = req.body.campground.price;
         campground.img = req.body.campground.img;
         campground.content = req.body.campground.content;
         await campground.save();
         req.flash("success", "Successfully Updated Campsite!");
         res.redirect(`/campsites/${campground.slug}`);
      } catch (err) {
         req.flash("error", err.message);
         res.redirect("back");
      }
   },

   async deleteCampground(req, res) {
      try {
         let campground = await Campground.findOne({ slug: req.params.slug });
         if (!campground) return res.redirect("/campsites");
         await Comment.remove({
            "_id": {
               $in: campground.comments
            }
         });
         await Review.remove({
            "_id": {
               $in: campground.reviews
            }
         });
         await campground.remove();
         req.flash("success", "Successfully Deleted Campsite");
         res.redirect("/campsites");
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   },

   async postLike(req, res) {
      try {
         let foundCampground = await Campground.findOne({ slug: req.params.slug });
         // check if req.user._id exists in foundCampground.likes
         let foundUserLike = foundCampground.likes.some(function (like) {
            return like.equals(req.user._id);   // === issue is there
         });
         let msg;
         if (foundUserLike) {
            // user already liked, removing like
            msg = "Campsite liked removed";
            foundCampground.likes.pull(req.user._id);
         } else {
            // adding the new user like
            msg = "Campsite liked";
            foundCampground.likes.push(req.user);
         }
         await foundCampground.save();
         req.flash("success", msg);
         return res.redirect("/campsites/" + foundCampground.slug);
      } catch (err) {
         console.log(err);
         res.redirect("back");
      }
   }
}

function escapeRegex(text) {
   return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

async function getWeatherApiStuff(campground){
   let long=campground.coordinates[0];
   let lat=campground.coordinates[1];
   let current={};
   let nextDays=[];
   let url=`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${long}&exclude={hourly}&appid=${apiKey}&units=metric`;
   let data=await fetch(url).then(res => res.json());

   current.main=data.current.weather[0].main;
   current.description=data.current.weather[0].description;
   current.icon=data.current.weather[0].icon;
   current.temp=Math.floor(data.current.temp);
   let i=0;
   for(const day of data.daily){
      i++;
      if(i==1)
         continue;
      let t={};
      t.main=day.weather[0].main;
      t.description=day.weather[0].description;
      t.icon=day.weather[0].icon;
      t.temp=Math.floor(day.temp.day);
      let date=moment().add(i-1,"days").format("MMM Do");
      t.date=date;
      nextDays.push(t);
   }
   return {current, nextDays};
}