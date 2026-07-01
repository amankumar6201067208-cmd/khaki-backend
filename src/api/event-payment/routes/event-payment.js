"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/event-payment/create",
      handler: "event-payment.create",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/event-payment/success",
      handler: "event-payment.success",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/event-payment/failure",
      handler: "event-payment.failure",
      config: { auth: false },
    },
  ],
};
