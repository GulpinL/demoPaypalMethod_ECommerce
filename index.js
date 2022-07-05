const express = require('express')
const app = express()
const port = 3005

require("dotenv").config()
var path=require('path');
const paypal2 = require("@paypal/checkout-server-sdk")
const paypal = require('paypal-rest-sdk');
const fs=require('fs');
const { engine }=require('express-handlebars');

app.use(express.json())
// app.set('views', path.join(__dirname,'views'))
// app.engine('handlebars',exphdbs.engine({defaultLayout:'main'}));
// app.set('view engine','handlebars');
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static('views/images'));

// const Environment =// khi can doi chi can swap cho 'production'
//   process.env.NODE_ENV === "production"
//     ? paypal.core.LiveEnvironment
//     : paypal.core.SandboxEnvironment
// const paypalClient = new paypal.core.PayPalHttpClient(
//   new Environment(
//     process.env.PAYPAL_CLIENT_ID,
//     process.env.PAYPAL_CLIENT_SECRET
//   )
// )
var items=JSON.parse(fs.readFileSync('items.json'));
var total =0;
for(i = 0;i<items.length;i++)
{
  total+=parseFloat(items[i].price)*items[i].quantity;
}

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
  });

app.get("/", (req, res) => {
    res.send('hello gulpinl')
    // res.render("home", {
    //   paypalClientId: process.env.PAYPAL_CLIENT_ID,
    // })
  })

// app.post('/pay', (req, res) => {
//     res.render('successTransaction')
// })

app.post('/pay',function(req,res){
    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:3005/success",
          "cancel_url": "http://localhost:3005/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": items
          },
          "amount": {
              "currency": "USD",
              "total": total.toString()
          },
          "description": "Hat for the best team ever"
      }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      res.render('cancel');
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            res.redirect(payment.links[i].href);
          }
        }
    }
  });
  
});

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": total.toString()
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
         res.render('cancle');
      } else {
          console.log(JSON.stringify(payment));
          res.render('successTransaction');
      }
  });
});


app.get('/cancel', (req, res) => res.send('Cancelled'));

app.listen(process.env.PORT || 3005, () => {
  console.log(`Example app listening on port ${port}`)
})