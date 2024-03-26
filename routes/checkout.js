const express = require("express");
const router = express.Router();
const braintree = require("braintree");
const dotenv = require("dotenv").config();

//Setup of Braintree credentials, linked to .env file
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BT_MERCHANT_ID,
  publicKey: process.env.BT_PUBLIC_KEY,
  privateKey: process.env.BT_PRIVATE_KEY,
});

// Endpoint for access token
router.get("/", (req, res, next) => {
  gateway.clientToken.generate({}, (err, response) => {
    res.send(response.clientToken);
  });
});

//Endpoint for creating a customer with payment method
router.post("/create_customer", (req, res) => {
  const { paymentMethodNonce, firstName, lastName, email, phone } = req.body;
  gateway.customer
    .create({
      paymentMethodNonce: paymentMethodNonce,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
    })
    .then((result) => res.send(result));
});

//Endpoint for creating a non 3DS enriched payment method nonce from token
router.get("/create_nonce", (req, res) => {
  gateway.paymentMethodNonce
    .create("08xefg2v")
    .then((payload) => res.send(payload));
});

//Endpoint for capturing transaction sale
router.post("/", (req, res, next) => {
  const {
    paymentMethodNonce,
    deviceData,
    amount
  } = req.body;
  gateway.transaction
    .sale({
      amount: amount, //should be set at server side exclusively
      deviceData: deviceData, //required
      paymentMethodNonce: paymentMethodNonce, //must be 3DS enriched
      descriptor: {
        name: "EDE*PRODUCT",
        phone: "1234567890",
        url: "www.abc.com",
      },
      options: {
        //
        submitForSettlement: true,
        //storeInVaultOnSuccess: true
      },
    })
    .then((result) => {
        res.send(result);

      // Transaction can be changed to instant settlement, but only in sandbox environment.
      if (result.success) {
        gateway.testing.settle(result.transaction.id).then((settleResult) => {
          settleResult.success;
          settleResult.transaction.status;
        });
      }
    });
});

module.exports = router;
