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
      ],
    },
  },
};
