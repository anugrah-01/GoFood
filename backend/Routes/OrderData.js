// const express = require('express')
// const User = require('../models/User')
// const Order = require('../models/Orders')
// const router = express.Router();

// router.post('/orderData', async (req, res) => {
//     let data = req.body.order_data
//     await data.splice(0,0,{Order_date:req.body.order_date})
//     console.log("1231242343242354",req.body.email)

//     //if email not exisitng in db then create: else: InsertMany()
//     let eId = await Order.findOne({ 'email': req.body.email })    
//     console.log(eId)
//     if (eId===null) {
//         try {
//             console.log(data)
//             console.log("1231242343242354",req.body.email)
//             await Order.create({
//                 email: req.body.email,
//                 order_data:[data]
//             }).then(() => {
//                 res.json({ success: true })
//             })
//         } catch (error) {
//             console.log(error.message)
//             res.send("Server Error", error.message)

//         }
//     }

//     else {
//         try {
//             await Order.findOneAndUpdate({email:req.body.email},
//                 { $push:{order_data: data} }).then(() => {
//                     res.json({ success: true })
//                 })
//         } catch (error) {
//             console.log(error.message)
//             res.send("Server Error", error.message)
//         }
//     }
// })

// router.post('/myOrderData', async (req, res) => {
//     try {
//         console.log(req.body.email)
//         let eId = await Order.findOne({ 'email': req.body.email })
//         //console.log(eId)
//         res.json({orderData:eId})
//     } catch (error) {
//         res.send("Error",error.message)
//     }
    

// })

// module.exports = router;

const express = require('express');
const router = express.Router();
const Order = require("../models/Orders");
const stripe = require('stripe')(process.env.STRIPE_KEY);



router.post('/create-checkout-session', async (req, res) => {
    try {
        const params = {
            submit_type: 'pay',
            mode: "payment",
            payment_method_types: ['card'],
            billing_address_collection: "auto",

            line_items: req.body[0].product.map((item) => {
                return {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: item.Pname,
                        },
                        unit_amount: item.price * 100,
                    },
                    adjustable_quantity: {
                        enabled: true,
                        minimum: 1,
                    },
                    quantity: item.qty
                }
            }),

            success_url: `${process.env.YOUR_DOMAIN}/success`,
            cancel_url: `${process.env.YOUR_DOMAIN}/cancel`,
        }

        const session = await stripe.checkout.sessions.create(params);
        console.log(session.id);

        let data = req.body[1]
        await data.order_data.splice(0, 0, { Order_date: req.body[1].order_date })

        let eId = await Order.findOne({ 'email': req.body[1].email })

        //console.log(eId)

        if (eId === null) {
            await Order.create({
                email: data.email,
                order_data: [data.order_data]
            });
        } else {
            await Order.findOneAndUpdate(
                { email: data.email },
                { $push: { order_data: data.order_data } }
            );
        }
        res.status(200).json({ success: true, sessionId: session.id });
    } 
    catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});

router.post('/myOrderData', async (req, res) => {
    try {
        console.log(req.body.email)
        let eId = await Order.findOne({ 'email': req.body.email })
        //console.log(eId)
        res.json({orderData:eId})
    } catch (error) {
        res.send("Error",error.message)
    }
    

});


module.exports = router;