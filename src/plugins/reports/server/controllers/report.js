"use strict";

const {
  buildReport,
  distinctSlots,
  distinctDates,
  statusCounts,
} = require("../../../../utils/reportBuilder");

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

  // Distinct time-slots for the current type/tour/date filters — feeds the
  // "Time slot" dropdown in the export modal.
  async slots(ctx) {
    try {
      const slots = await distinctSlots(strapi, ctx.query);
      ctx.body = { slots };
    } catch (err) {
      // @ts-ignore
      return ctx.throw(err.status || 500, err.message);
    }
  },

  // Distinct tour dates for the current type/tour — feeds the "Tour date"
  // dropdown in the export modal.
  async dates(ctx) {
    try {
      const dates = await distinctDates(strapi, ctx.query);
      ctx.body = { dates };
    } catch (err) {
      // @ts-ignore
      return ctx.throw(err.status || 500, err.message);
    }
  },

  // Per-status booking counts for the current tour/date/slot — feeds the
  // "Status" dropdown so it shows what exists and how many.
  async statuses(ctx) {
    try {
      const statuses = await statusCounts(strapi, ctx.query);
      ctx.body = { statuses };
    } catch (err) {
      // @ts-ignore
      return ctx.throw(err.status || 500, err.message);
    }
  },
});
