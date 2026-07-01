"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/reports/bookings",
      handler: "report.bookings",
      // Public route guarded by the EXPORT_TOKEN query secret (see controller),
      // so it can be triggered straight from a browser bookmark.
      config: {
        auth: false,
      },
    },
  ],
};
