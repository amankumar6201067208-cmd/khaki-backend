"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/booking/create",
      handler: "booking.createBooking",
      config: {
        auth: false
      }
    }
  ]
};