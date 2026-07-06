"use strict";

const { buildReport } = require("../../../utils/reportBuilder");

module.exports = {
  async bookings(ctx) {
    // Shared-secret guard (fail-closed: no token configured = no export).
    const expected = process.env.EXPORT_TOKEN;
    if (!expected) {
      return ctx.throw(503, "Export is not configured (set EXPORT_TOKEN).");
    }
    if (ctx.query.token !== expected) {
      return ctx.throw(401, "Invalid or missing export token.");
    }

    let report;
    try {
      report = await buildReport(strapi, ctx.query);
    } catch (err) {
      // @ts-ignore
      return ctx.throw(err.status || 500, err.message);
    }

    ctx.set("Content-Type", "text/csv; charset=utf-8");
    ctx.set("Content-Disposition", `attachment; filename="${report.filename}"`);
    // Prepend a BOM so Excel renders UTF-8 (₹, accents) correctly.
    ctx.body = "﻿" + report.csv;
  },
};
