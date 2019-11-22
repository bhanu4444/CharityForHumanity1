
var Charity = require('../models/charity');
module.exports = {
    isLoggedIn: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error', 'You must be signed in to do that!');
        res.redirect('/login');
    },
    isAdmin: function (req, res, next) {
        if (req.user && req.user.isAdmin) {
            next();
        } else {
            req.flash('error', 'You must be signed in as admin to do that!');
           return res.redirect('back');
        }
    }
}