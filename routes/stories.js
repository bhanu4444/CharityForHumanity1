var express = require("express");
var router = express.Router();
var Story = require("../models/story");
var middleware = require("../middleware");
var { isLoggedIn, isAdmin } = middleware; 

//INDEX - show all stories
router.get("/", function (req, res) {
    Story.find({}, function (err, allStories) {
        if (err) {
            console.log(err);
        } else {
            res.render("stories/index", { stories: allStories, page: 'stories'});
        }
    });
});

//CREATE - add new story to DB
router.post("/", isAdmin,function (req, res) {
    var newStory = req.body.story;
    // Create a new story and save to DB
    Story.create(newStory, function (err, newlyCreated) {
       if (err) {
           console.log(err);
        } else {
      //redirect back to story page
                console.log(newlyCreated);
                res.redirect("/stories");
            }
        });
});

//NEW -  form to create new story
router.get("/new", isAdmin, function (req, res) {
    res.render("stories/new");
});

// SHOW - shows more info about one story
router.get("/:id", function (req, res) {
    //find the story with provided ID
    Story.findById(req.params.id, function (err, foundStory) {
        if (err || !foundStory) {
            console.log(err);   
            return res.redirect('/stories');
        }
        
        //render show template with that story
        res.render("stories/show", { story: foundStory });
    });
});



// EDIT - shows edit form for a story
router.get("/:id/edit", isAdmin, function (req, res) {
    Story.findById(req.params.id, function(err, foundStory){
        if(err){
            res.redirect("/stories");
        } else {
            //render edit template with that story
            res.render("stories/edit", { story: foundStory});
        }
    });
    
});

// PUT - updates story in the database
router.put("/:id", isAdmin, function (req, res) {
    var updatedStory = req.body.story;
        Story.findByIdAndUpdate(req.params.id, { $set: updatedStory }, function (err, story) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success", "Successfully Updated!");
                res.redirect("/stories/" + story._id);
            }
        });
});

// DELETE - removes story from the database
router.delete("/:id", isAdmin, function (req, res) {
    Story.findByIdAndRemove(req.params.id, function(err){
        if(err){
            req.flash('error', err.message);
            res.redirect("/stories");
        } else {
            req.flash('success', 'Story deleted ');
            res.redirect("/stories");
        }
    });
});

module.exports = router;