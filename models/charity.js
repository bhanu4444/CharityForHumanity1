var mongoose = require("mongoose");

var charitySchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
});

module.exports = mongoose.model("Charity", charitySchema);