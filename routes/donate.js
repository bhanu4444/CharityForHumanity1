var express = require("express");
var router = express.Router();
var Charity = require("../models/charity");
var middleware = require("../middleware");
var { isLoggedIn, isAdmin } = middleware; 
const _ = require('lodash');
const path = require('path');
const {Donor} = require('../models/donor');
const {initializePayment, verifyPayment} = require('../config/paystack')(request);

router.get('/',(req, res) => {

    res.render('donate/index');

});



router.post('/paystack/pay', (req, res) => {

    const form = _.pick(req.body,['amount','email','full_name']);

    form.metadata = {

        full_name : form.full_name

    }

    form.amount *= 100;

    

    initializePayment(form, (error, body)=>{

        if(error){

            //handle errors

            console.log(error);

            return res.redirect('/donate/error')

            return;

        }

        response = JSON.parse(body);

        res.redirect(response.data.authorization_url)

    });

});



router.get('/paystack/callback', (req,res) => {

    const ref = req.query.reference;

    verifyPayment(ref, (error,body)=>{

        if(error){

            //handle errors appropriately

            console.log(error)

            return res.redirect('/donate/error');

        }

        response = JSON.parse(body);        



        const data = _.at(response.data, ['reference', 'amount','customer.email', 'metadata.full_name']);



        [reference, amount, email, full_name] =  data;

        

        newDonor = {reference, amount, email, full_name}



        const donor = new Donor(newDonor)



        donor.save().then((donor)=>{

            if(!donor){

                return res.redirect('/donate/error');

            }

            res.redirect('/donate/receipt/'+donor._id);

        }).catch((e)=>{

            res.redirect('/donate/error');

        })

    })

});



router.get('/receipt/:id', (req, res)=>{

    const id = req.params.id;

    Donor.findById(id).then((donor)=>{

        if(!donor){

            //handle error when the donor is not found

            res.redirect('/donate/error')

        }

        res.render('donate/success',{donor});

    }).catch((e)=>{

        res.redirect('/donate/error')

    })

})



router.get('/error', (req, res)=>{

    res.render('donate/error.ejs');

})

module.exports = router;