"use strict";

const report = require("./controllers/report");

/**
 * Reports plugin server. Exposes one admin-authenticated route that streams a
 * CSV report. Because the route is `type: 'admin'`, Strapi requires a logged-in
 * admin — so no export token is needed when triggered from the admin panel.
 */
module.exports = {
  register() {},
  bootstrap() {},
  controllers: { report },
  routes: {
    admin: {
      type: "admin",
      routes: [
        {
          method: "GET",
          path: "/export",
          handler: "report.export",
          config: { policies: [] },
        },
      ],
    },
  },
};
