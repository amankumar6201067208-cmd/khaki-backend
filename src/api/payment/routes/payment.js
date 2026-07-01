"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/payment/create",
      handler: "payment.create",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/payment/success",
      handler: "payment.success",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/payment/failure",
      handler: "payment.failure",
      config: {
        auth: false,
      },
    },
  ],
};