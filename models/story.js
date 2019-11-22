var mongoose = require("mongoose");

var storySchema = new mongoose.Schema({
    title: String,
    image: String,
    content: String,
});

module.exports = mongoose.model("Story",storySchema);
