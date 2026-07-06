"use strict";

const { buildReport } = require("../../../../utils/reportBuilder");

module.exports = ({ strapi }) => ({
  async export(ctx) {
    let report;
    try {
      report = await buildReport(strapi, ctx.query);
    } catch (err) {
      // @ts-ignore
      return ctx.throw(err.status || 500, err.message);
    }

    ctx.body = {
      filename: report.filename,
      rowCount: report.rowCount,
      csv: report.csv,
    };
  },
});
