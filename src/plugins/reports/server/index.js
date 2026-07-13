"use strict";
const report = require("./controllers/report");

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
        {
          method: "GET",
          path: "/slots",
          handler: "report.slots",
          config: { policies: [] },
        },
        {
          method: "GET",
          path: "/dates",
          handler: "report.dates",
          config: { policies: [] },
        },
        {
          method: "GET",
          path: "/statuses",
          handler: "report.statuses",
          config: { policies: [] },
        },
      ],
    },
  },
};
