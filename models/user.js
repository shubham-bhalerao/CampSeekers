var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: String,
    email: {
        type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {
        type: Boolean,
        default: false
    },
    firstName: String,
    lastName: String,
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification"
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    bookedCampgrounds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campground"
    }]
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);