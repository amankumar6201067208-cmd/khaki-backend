"use strict";

const { buildReport } = require("../../../../utils/reportBuilder");

module.exports = ({ strapi }) => ({
  async export(ctx) {
    let report;
    try {
      report = await buildReport(strapi, ctx.query);
    } catch (err) {
      return ctx.throw(err.status || 500, err.message);
    }

    // Return JSON — the admin fetch client parses responses as JSON, so the
    // browser rebuilds the CSV file from this payload (see ReportExportButton).
    ctx.body = {
      filename: report.filename,
      rowCount: report.rowCount,
      csv: report.csv,
    };
  },
});
