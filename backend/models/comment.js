const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    text: String,
    sentiment: String,
    votes: Number,
    hearted: Boolean,
    replies: Number,
    time: String,
});

module.exports = mongoose.model("Comment", commentSchema);
