module.exports = {
  routes: [
    {
      method: "POST",
      path: "/donation-payment/create",
      handler: "donation-payment.create",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/donation-payment/success",
      handler: "donation-payment.success",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/donation-payment/failure",
      handler: "donation-payment.failure",
      config: { auth: false },
    },
  ],
};