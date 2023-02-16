const express = require("express");
const app = express();
var nodemailer = require('nodemailer');
const braintree = require("braintree");
const hbs = require('nodemailer-express-handlebars')
//const stripe = require('stripe')('sk_test_51MRvqTJQb82VkSkCQHcvLZa9kxa47vcWGZAR863BgC9qtPzlOPW57peteRwedo9W0XMNGxGLzleZb5qODDI9Jgvb00TAaXiHby');
const stripe = require('stripe')('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');

app.use(express.json());

const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId:   'vq425s246nw9mjzq',
    publicKey:    'ksbyvwdwk6cb4b97',
    privateKey:   '309d8245ba32e323dd830d3db4582932'
});

app.post('/appointment/paypal', async (req, res) => {

    console.log(req.body);
    let time = req.body.dateTime;
    
    let amtString = addZeroes(req.body.amount).toString();
        amtString = amtString.replace(".", ""); 
        console.log(amtString)
        console.log(req.body)

    const saleRequest = {
        amount: addZeroes(req.body.amount),
        paymentMethodNonce: req.body.nonce,
        options: {
          submitForSettlement: true,
          paypal: {
            customField: "Enya Hair",
            description: "Enya Hair Product",
          },
        }
      };
      
      gateway.transaction.sale(saleRequest, (err, result) => {
        
        if (err) {
          console.log(JSON.stringify(String("Error:  " + err)));
          res.send(JSON.stringify(err));
        } else if (result.success) {
          console.log("Success! Transaction ID: " + result.transaction.id);
          postTime(time)
          res.send(JSON.stringify(String(result.success + " " + "id: " + result.transaction.id)));
        } else {
          console.log("Error:  " + result.message);
          res.send(JSON.stringify(String(result.message)));
        }
      });

});

app.post('/appointment/applepay', async (req, res) => {
    const data = req.body;
    let time = req.body.dateTime;

    const customer = await stripe.customers.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
         address: {
            line1: data.line1,
            city: data.city,
            postal_code: data.postal_code,
            country: 'UK',
         },
    }).then(async (customer) => {
        
        //Take out decimal
        let amtString = addZeroes(data.amount).toString();
        amtString = amtString.replace(".", ""); 
        console.log(amtString)
        console.log(data)

            const paymentIntent = await stripe.paymentIntents.create({
                
                amount: parseInt(amtString),
                currency: 'gbp',
                payment_method: data.paymentMethod,
                customer: customer.id,
                receipt_email: customer.email,
                confirm: true,
                });

                itemsFull = "";
                itemsFullArray = [];

                itemsFull = itemsFull + 'Service: ' + data.serviceName + '\n';
                itemsFullArray.push(('Service: ' + data.serviceName + '\n'))

                data.extras.forEach(x =>{
                  itemsFull = itemsFull + 'Extras: ' + x + '\n';
                  itemsFullArray.push(('Extras: ' + x + '\n'))
                });
                

                itemsFull = itemsFull + 'Date & Time: ' + data.dateTime + '\n';
                itemsFullArray.push(('Date & Time: ' + data.dateTime + '\n'))

                sendEmail(data.name, data.email, data.phone, data.line1, data.city, data.postal_code, itemsFull)
                sendShopConfirmEmail(data.name, data.email, itemsFullArray)
                postTime(time)
                res.send(JSON.stringify(paymentIntent.client_secret));

        })

});

app.post('/shop/paypal', async (req, res) => {


  let data = req.body

  let amtString = addZeroes(req.body.amount).toString();
      amtString = amtString.replace(".", ""); 
      console.log(amtString)
      console.log(req.body)

  const saleRequest = {
      amount: addZeroes(req.body.amount),
      paymentMethodNonce: req.body.nonce,
      options: {
        submitForSettlement: true,
        paypal: {
          customField: "Enya Hair",
          description: "Enya Hair Product",
        },
      }
    };

    var items = "";
    data.items.forEach(element => {
      element.forEach(x => {
        items = items + x
        items = items + "\n"
      })

    });
    
    gateway.transaction.sale(saleRequest, (err, result) => {
      
      if (err) {
        console.log(JSON.stringify(String("Error:  " + err)));
        res.send(JSON.stringify(err));
      } else if (result.success) {
        console.log("Success! Transaction ID: " + result.transaction.id);
        sendEmail(data.name, data.email, data.phone, data.address, data.city, data.post_code, items)
        res.send(JSON.stringify(String(result.success + " " + "id: " + result.transaction.id)));
      } else {
        console.log("Error:  " + result.message);
        res.send(JSON.stringify(String(result.message)));
      }
    });

});

app.post('/shop/applepay', async (req, res) => {
  const data = req.body;

  const customer = await stripe.customers.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
       address: {
          line1: data.line1,
          city: data.city,
          postal_code: data.postal_code,
          country: 'UK',
       },
  }).then(async (customer) => {
      
      //Take out decimal
      let amtString = addZeroes(data.amount).toString();
      amtString = amtString.replace(".", ""); 
     

          const paymentIntent = await stripe.paymentIntents.create({
              
              amount: parseInt(amtString),
              currency: 'gbp',
              payment_method: data.paymentMethod,
              customer: customer.id,
              receipt_email: customer.email,
              confirm: true,
              });

              var items = [];
              data.item.forEach(element => {

                console.log(element)
                 element.forEach(x =>{
                   items.push(x);
                 })

                
              });

              itemsFull = "";
              data.itemFull.forEach(element => {

                console.log(element)
                 element.forEach(x =>{
                   itemsFull = itemsFull + x
                   itemsFull = itemsFull + "\n"
                 })

                
              });
              sendEmail(data.name, data.email, data.phone, data.address, data.city, data.post_code, itemsFull)
              sendShopConfirmEmail(data.name, data.email, items)

              res.send(JSON.stringify(paymentIntent.client_secret));

      })

});

app.get('/', async function requestHandler(req, res){

    const ar = ["apple", "banana", "cherry"];

    //res.setHeader('Content-type', 'application/json');
    //res.setHeader('Access-Control-Allow-Origin', "*");
    //res.writeHead(200); //status code HTTP 200 / OK

});

app.get('/test', async function requestHandler(req, res){

  const ar = ["apple", "banana", "cherry"];

  sendShopConfirmEmail("John", "info@the-randomstuff.com", "")

});

function sendEmail(name, email, phone, address, city, postCode, items) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'info@soignehairco.com',
          pass: 'ofirwjwsksrngzev'
        }
      });

      var mailOptions = {
        from: 'info@soignehairco.com',
        to: 'enyaatiopou@gmail.com',
        //to: 'johnakpenyi@hotmail.com',
        subject: 'New Order For: ' + name,
        text: 'Name: ' + name + "\n" +
        'Email: ' + email + "\n" +
        'Phone Number: ' + phone + "\n" +
        'Address Line: ' + address + "\n" +
        'City: ' + city + "\n" +
        'Post Code: ' + postCode + "\n \n" +
        'Item/s Info: ' + "\n" + items,
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}

function sendShopConfirmEmail(name, email, items){
  
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'info@soignehairco.com',
      pass: 'ofirwjwsksrngzev'
    }
  });

  transporter.use('compile', hbs({
    viewEngine: 'express-handlebars',
    viewPath: './emailHtml/'
  }));

  var mailOptions = {
    from: 'info@soignehairco.com',
    to: email,
    subject: 'EnyaHair Order Confirmation',
    text: 'Name: ' + name + "\n" +
    'Item/s Info: ' + "\n" + items,
    template: 'main',
     context: {
       items: items,
     }
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

}


function addZeroes(num) {
    // Cast as number
    var num = Number(num);
    // If not a number, return 0
    if (isNaN(num)) {
        return 0;
    }
    // If there is no decimal, or the decimal is less than 2 digits, toFixed
    if (String(num).split(".").length < 2 || String(num).split(".")[1].length<=2 ){
        num = num.toFixed(2);
    }
    // Return the number
    return num;
}


















//apple
const path = require('path');
const apn = require("apn");
//firestore
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
const { time } = require("console");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const notificationRef = db.collection("Notification");
const serviceRef = db.collection("Service");
const itemRef = db.collection("Item")
const bookedRef = db.collection("Booked")
const slayWallRef = db.collection("SlayWall")
const homeitemRef = db.collection("HomeItem")

// Set up the APN provider
const apnProvider = new apn.Provider({
    token: {
        key: 'AuthKey_78LZS7PS9C.p8',
        keyId: '78LZS7PS9C',
        teamId: '5MM3Y72PH8'
    },
    production: true
});




app.post('/notification/register', function(request, response){

  console.log(request.body);

  notificationRef.doc(request.body.deviceId).set({
    deviceToken: request.body.deviceToken
  }).then(function (){
    console.log("Token with device_ID:", request.body.deviceId, "Added to database");
  }).catch(function (error) {
    console.error("Error adding token: ", error)
  })

});


app.get('/notification', function(request, response){
  let fs = require('fs');
  fs.readFile('./web_view/notification.html', null, function (error, data) {
    if (error) {
        response.writeHead(404);
        respone.write('file not found');
    } else {
        response.write(data);
    }
    response.end();
    });
  });

app.post('/sendnotification', async function(request, response){

  var tokens = [];

  await notificationRef.get().then((querySnapshot) => {
    querySnapshot.forEach(document=> {

        const token = {deviceToken: document.data().deviceToken}.deviceToken

        tokens.push(token)

    })
})

  // Set up the notification
  const notification = new apn.Notification();
  notification.topic = 'randomstuff.enyahair';
  notification.alert = request.body.message;
  notification.sound = "ping.aiff";
  
  
  // Send the notification to particular devices
  apnProvider.send(notification, tokens).then(result => {
    console.log(result);
  });
});

//7482b1a71f3c3e3c4bc4a532149a9c231a4eb9cf862361d417821b9776dd105f


app.get('/test/get', async function(req, res){
  var items = []

  await db.collection("Test").get().then((querySnapshot) => {

    querySnapshot.forEach(document => {
        const category = {
            category: document.data().category,
            items: document.data().items
        }

        items.push(category)

    })
  })

  console.log(items);
  res.send(JSON.stringify(items))

})


app.get('/item/get', async function(req, res){
  var items = []

  await itemRef.get().then((querySnapshot) => {

    querySnapshot.forEach(document => {
        const category = {
            category: document.data().category,
            items: document.data().items
        }

        items.push(category)

    })
  })

  console.log(items);
  res.send(JSON.stringify(items))

})

app.get('/homeitem/get', async function(req, res){
  var item = []

  await homeitemRef.get().then((querySnapshot) => {

    querySnapshot.forEach(document => {
        const category = {
            category: document.data().category,
            items: document.data().items
        }

        item.push(category)

    })
  })

  console.log(item);
  res.send(JSON.stringify(item))

})




app.get('/service/get', async function(req, res){
  
  var services = []

  await serviceRef.get().then((querySnapshot) => {

    querySnapshot.forEach(document => {
        const category = {
            category: document.data().category,
            services: document.data().service
        }

        services.push(category)

    })
  })

  console.log(services);
  res.send(JSON.stringify(services))

})

app.get('/booked/get', async function(req, res){
  
  var bookedTimes = []

  await bookedRef.get().then((querySnapshot) => {

    querySnapshot.forEach(document => {
        const booked = {
            timeBooked: document.data().dateTime
        }

        bookedTimes.push(booked)

    })
  })

  console.log(bookedTimes);
  res.send(JSON.stringify(bookedTimes))

})

app.get('/slaywall/get', async function(req, res){
  
  var ar = []

  await slayWallRef.get().then((querySnapshot) => {
    querySnapshot.forEach(document => {

        const photos = {
            photos: document.data().photos
        }

        ar = photos

    })
  })

  console.log(ar);
  res.send(JSON.stringify(ar))

})

async function postTime (dateTime){

  await bookedRef.add({
        dateTime: dateTime
    }).then(function (docRef){
        console.log("Doc with ID:", docRef.id );

    }).catch(function (error) {
        console.error("Error adding doc: ", error)
    })

}




app.listen(80);