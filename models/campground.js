var mongoose = require("mongoose");
var mongoosePaginate = require('mongoose-paginate');

var campgroundSchema = new mongoose.Schema({
   img: String,
   title: {
      type: String,
      required: "Campground Name cannot be empty"
   },
   slug: {
      type: String,
      unique: true
   },
   content: String,
   price: Number,
   location: String,
   coordinates: Array,
   createdAt: {
      type: Date,
      default: Date.now
   },
   comments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
   }],
   author: {
      username: String,
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      }
   },
   reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
   }],
   rating: {
      type: Number,
      default: 0
   },
   likes: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      }
   ]
});

campgroundSchema.pre('save', async function (next) {
   try {
      //this refers to new that is campground getting created
      // check if a new campground is being saved, or if the campground name is being modified
      if (this.isNew || this.isModified("title")) {
         this.slug = await generateUniqueSlug(this._id, this.title);
      }
      next();
   } catch (err) {
      next(err);
   }
});

campgroundSchema.plugin(mongoosePaginate);
var Campground = mongoose.model("Campground", campgroundSchema);
module.exports = Campground;

async function generateUniqueSlug(id, campgroundName, slug) {
   try {
      // generate the initial slug
      if (!slug) {
         slug = slugify(campgroundName);
      }
      // check if a campground with the slug already exists
      var campground = await Campground.findOne({ slug: slug });
      // check if a campground was found or if the found campground is the current campground
      if (!campground || campground._id.equals(id)) {
         return slug;
      }
      // if not unique, generate a new slug
      var newSlug = slugify(campgroundName);
      // check again by calling the function recursively
      return await generateUniqueSlug(id, campgroundName, newSlug);
   } catch (err) {
      throw new Error(err);
   }
}

function slugify(text) {
   var slug = text.toString().toLowerCase()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '')          // Trim - from end of text
      .substring(0, 75);           // Trim at 75 characters
   return slug + "-" + Math.floor(1000 + Math.random() * 9000);  // Add 4 random digits to improve uniqueness
}