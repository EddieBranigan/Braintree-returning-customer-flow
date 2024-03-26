var payButton = document.getElementById("submit");
var nonce, bin;
var buyerAddress = {
  givenName: "Jane",
  surname: "Doe",
  phoneNumber: "1234567890",
  streetAddress: "123 Box Street",
  extendedAddress: "Anytown",
  locality: "Here",
  region: "CA",
  postalCode: "12345",
  countryCodeAlpha2: "US",
};

fetch("/checkout/create_nonce")
  .then((response) => response.json())
  .then((jsonNonce) => {
    nonce = jsonNonce.paymentMethodNonce.nonce;
    bin = jsonNonce.paymentMethodNonce.details.bin;
    console.log(nonce, bin)
  });

fetch("/checkout")
  .then((response) => response.text())
  .then((client_token) => {
    braintree.client
      .create({ authorization: client_token })
      .then((instance) => {
        braintree.threeDSecure
          .create({
            client: instance,
            version: 2,
          })
          .then((threeDSecure) => {
            payButton.addEventListener("click", (e) => {
              e.preventDefault();

              threeDSecure
                .verifyCard({
                  onLookupComplete: (data, next) => {
                    console.log(`Data in onLookup: ${data}`)
                    next();
                  },
                  collectDeviceData: true,
                  amount: "500",
                  nonce: nonce, //non 3DS enriched nonce from server
                  bin: bin, // bin details provided by create.paymentmethodnonce on server
                  email: "test@123.ie",
                  billingAddress: buyerAddress,
                })
                .then((payload) => {
                  console.log(JSON.stringify(payload))
                  fetch("/checkout", {
                    method: "POST",
                    body: JSON.stringify({
                      paymentMethodNonce: payload.nonce,
                      threeDSecureAuthenticationId: payload.threeDSecureInfo.threeDSecureAuthenticationId,
                      amount: "500",
                      phone: "041 9855833",
                      email: "test@123.ie"
                    }),
                    headers: {
                      "Content-Type": "application/json",
                    },
                  })
                    .then((response) => response.json())
                    .then((result) => {
                      document.getElementById("checkout-message").innerHTML =
                        "<h2>Transaction was successful</h2>\n\n" +
                        "<pre>" +
                        JSON.stringify(result, null, 3) +
                        "</pre>";
                    });
                });
            });
          });
      });
  });
