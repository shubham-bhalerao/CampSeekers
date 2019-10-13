var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
    text: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    author: {
        username: String,
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }
});

module.exports = mongoose.model("Comment", commentSchema);