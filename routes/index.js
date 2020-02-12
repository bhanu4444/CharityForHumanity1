var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var crypto = require("crypto");
var async = require("async");
var nodemailer = require("nodemailer");
var bodyParser = require("body-parser");
var middleware = require("../middleware");
var { isLoggedIn, isAdmin } = middleware; 

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

//root route
router.get("/", function (req, res) {
    res.render("landing");
    console.log(process.env.GMAILPW);
    
});

//User routes
router.get("/user", isLoggedIn, function (req, res) {
    res.render("user", { page: 'user' });
});
router.post("/user", isLoggedIn, function (req, res) {
    console.log(req.user._id);
    User.findOne(req.user._id, function(err, foundUser){
        if(err)
        {
            req.flash("error", err.message);
        }
        else
        {
            console.log(foundUser);
            foundUser.username = req.body.username;
            foundUser.firstName = req.body.firstName;
            foundUser.lastName = req.body.lastName;
            foundUser.email = req.body.email;
            foundUser.save(function(err){
                if(err)
                {
                    req.flash("error", err.message);
                }
                else
                {
                    req.flash("success", "User Successfully Updated!");
                    req.logIn(foundUser,function(err){
                        if(err)
                        {
                            req.flash("error", err.message);
                            res.redirect("/");
                        }
                        else
                        {
                            res.redirect("/charities");
                        }
                    });
                }
            });   
        }
    });
});
router.get("/resetPassword", isLoggedIn, function (req, res) {
    res.render("resetPassword", { page: 'resetPassword' });
});
router.post("/resetPassword", isLoggedIn, passport.authenticate("local",
    { 
        successRedirect: "",
        failureRedirect: "/resetPassword",
        failureFlash: "Password is incorrect",
        successFlash: ''
    }), function (req, res) {
        if(req.body.newPassword = req.body.confirmNewPassword)
        {
            User.findOne(req.user._id, function(err, foundUser){
                foundUser.setPassword(req.body.newPassword, function(err){
                    foundUser.save(function(err){
                        if(err)
                        {
                            req.flash("error", err.message);
                        }
                        else
                        {
                            req.flash("success","Password Updated Successfully!");
                            req.logIn(foundUser,function(err){
                                if(err)
                                {
                                    req.flash("error", err.message);
                                    res.redirect("/");
                                }
                                else
                                {
                                    res.redirect("/charities");
                                }
                            });
                        }
                    });
                });
            });            
        }
    }
);


//Route to show register form
router.get("/register", function (req, res) {
    res.render("register", { page: 'register' });
});
router.get("/admin_register",isAdmin , function (req, res) {
    res.render("admin_register", { page: 'admin_register' });
});

//Route to handle signup logic
router.post("/register", function (req, res) {
    var newUser = new User({ username: req.body.username, firstName: req.body.firstName, lastName:req.body.lastName, email: req.body.email });
    if(req.body.adminCode === 'admin123'){
        newUser.isAdmin = true;
    }
    if (newUser.firstName === '' || newUser.lastName === '' || newUser.email === ''){
        return res.render("register", { error:"Please enter all the details" });
    }
    User.register(newUser, req.body.password, function (err, user) {
        if (err ) {
            console.log(err);
            return res.render("register", { error: err.message });
        }
        // {
        //     return res.render("register", {error: "Enter the required details"});
        // }
        console.log(req.body.firstName);
        passport.authenticate("local")(req, res, function () {
            console.log("authenticated");
            req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
            res.redirect("/charities");
        });
    });
});

//show login form
router.get("/login", function (req, res) {
    res.render("login", { page: 'login' });
});

//handling login logic
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/charities",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: 'Welcome to Charity For Humanity!'
    }), function (req, res) {
});

// logout route
router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "See you later!"); 
    res.redirect("/charities");
});

// Forgot password routes
router.get("/forgot", function(req, res){
    res.render('forgot');
});

router.post('/forgot', function(req, res, next){
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done){
            User.findOne({email: req.body.email}, function(err, user){
                if(!user){
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; //1 hour

                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        function(token, user, done){
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'charityforhumanity4444@gmail.com',
                    pass: 'Charity@123'
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'charityforhumanity4444@gmail.com',
                subject: 'Password reset',
                text: 'Click on the following link to reset password \n\n' + 
                    'http://' + req.headers.host + '/reset/' + token 
            };
            smtpTransport.sendMail(mailOptions, function(err){
                console.log('mail sent');
                req.flash('success', 'An email has been sent to ' + user.email + ' with further instructions');
                done(err, 'done');
            });
        }
    ], function(err){
        if(err) return next(err);
        res.redirect('/forgot');
    });
});

//Reset routes
router.get('/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', {token: req.params.token});
    });
});

router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                if (!user) {
                     req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                
                if(req.body.password === req.body.confirm){
                    user.setPassword(req.body.password, function(err){
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function(err){
                            req.logIn(user, function(err){
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash("error", "passwords do not match");
                    return res.redirect('back');
                }
               
            });
            
        },
        function (user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'bhanuthakur4@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'bhanuthakur4@gmail.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }
    ], function (err) {
        res.redirect('/charities');
    });
});


//About us routes
router.get("/about", function (req, res) {
    res.render("about", { page: 'about' });
});

//Contact page routes
router.post("/contact", (req, res, next) => {
    async.waterfall([
        function (done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'charityforhumanity4444@gmail.com',
                    pass: 'Charity@123'
                }
            });
            var mailOptions = {
                to: '17bcs019@smvdu.ac.in',
                from: 'charityforhumanity4444@gmail.com',
                subject: 'Message From:' + req.body.name + " #CharityForHumanity" ,
                text: req.body.message + "\n\nEmail: " + req.body.email
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log('mail sent');
                req.flash('success', 'Message has been sent ');
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/contact');
    });
});

router.get("/contact", function (req, res) {
    res.render("contact", { page: 'contact' });
});


   


//Route to show support page
router.get("/support", function (req, res) {
    res.render("support", { page: 'support' });
});

module.exports = router;


//export GMAILPW=yourPassword