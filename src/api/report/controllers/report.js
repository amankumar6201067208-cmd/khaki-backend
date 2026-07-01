"use strict";

/**
 * Public CSV report export, protected by a shared secret (?token=EXPORT_TOKEN).
 * Lets you build targeted reports straight from a browser bookmark. The actual
 * report logic lives in src/utils/reportBuilder.js (shared with the admin
 * Reports plugin).
 *
 * Examples:
 *   /api/reports/bookings?token=SECRET&type=group
 *   /api/reports/bookings?token=SECRET&type=group&tour=jaipur
 *   /api/reports/bookings?token=SECRET&type=all&dateFrom=2026-01-01&dateTo=2026-03-31&status=paid
 */

const { buildReport } = require("../../../utils/reportBuilder");

module.exports = {
  async bookings(ctx) {
    // 🔐 Shared-secret guard (fail-closed: no token configured = no export).
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
      return ctx.throw(err.status || 500, err.message);
    }

    ctx.set("Content-Type", "text/csv; charset=utf-8");
    ctx.set("Content-Disposition", `attachment; filename="${report.filename}"`);
    // Prepend a BOM so Excel renders UTF-8 (₹, accents) correctly.
    ctx.body = "﻿" + report.csv;
  },
};
