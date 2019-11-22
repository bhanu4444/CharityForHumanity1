var express = require("express");
var router = express.Router();
var Charity = require("../models/charity");
var middleware = require("../middleware");
var { isLoggedIn, isAdmin } = middleware; 
//INDEX - show all charities
router.get("/", function (req, res) {
    Charity.find({}, function (err, allCharities) {
        if (err) {
            console.log(err);
        } else {
                //req.user contains the user info so we pass it on to templates
                console.log(req.user);
                res.render("charities/index", { charities: allCharities, page: 'charities'});
        }
    });
});

//CREATE - add new charity to DB
router.post("/", isAdmin,function (req, res) {
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    
    var newCharity = { name: name, image: image, description: desc};
    // Create a new charity and save to DB
    Charity.create(newCharity, function (err, newlyCreated) {
       if (err) {
           console.log(err);
        } else {
      //redirect back to charity page
                console.log(newlyCreated);
                res.redirect("/charities");
            }
        });
});

//NEW -  form to create new charity
router.get("/new", isAdmin, function (req, res) {
    res.render("charities/new");
});

// SHOW - shows more info about one charity
router.get("/:id", function (req, res) {
    //find the charity with provided ID
    Charity.findById(req.params.id, function (err, foundCharity) {
        if (err || !foundCharity) {
            console.log(err);   
            return res.redirect('/charities');
        }
        
        //render show template with that charity
        res.render("charities/show", { charity: foundCharity });
    });
});



// EDIT - shows edit form for a charity
router.get("/:id/edit", isAdmin, function (req, res) {
    Charity.findById(req.params.id, function(err, foundCharity){
        if(err){
            res.redirect("/charities");
        } else {
            //render edit template with that charity

            res.render("charities/edit", { charity: foundCharity});
        }
    });
    
});

// PUT - updates charity in the database
router.put("/:id", isAdmin, function (req, res) {
        var newData = { name: req.body.name, image: req.body.image, description: req.body.description };
        Charity.findByIdAndUpdate(req.params.id, { $set: newData }, function (err, charity) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                req.flash("success", "Successfully Updated!");
                res.redirect("/charities/" + charity._id);
            }
        });
});

// DELETE - removes charity from the database
router.delete("/:id", isAdmin, function (req, res) {
    Charity.findByIdAndRemove(req.params.id, function(err){
        if(err){
            req.flash('error', err.message);
            res.redirect("/charities");
        } else {
            req.flash('success', 'Charity deleted ');
            res.redirect("/charities");
        }
    });


            //  req.charity.remove(function (err) {
            //     if (err) {
                    
            //         return res.redirect('/');
            //     }
                
            //     res.redirect('/charities');
            // });

});


module.exports = router;