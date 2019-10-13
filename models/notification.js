const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    user: String,
    campgroundId: String,
    createdWhat: String,
    isRead: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Notification", notificationSchema);