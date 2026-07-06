"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/reports/bookings",
      handler: "report.bookings",

      config: {
        auth: false,
      },
    },
  ],
};
