var mongoose = require("mongoose");
var mongoosePaginate = require('mongoose-paginate');

var campgroundSchema = new mongoose.Schema({
    img: String,
    title: String,
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
    }
});

campgroundSchema.plugin(mongoosePaginate);
var Campground = mongoose.model("Campground", campgroundSchema);
module.exports = Campground;