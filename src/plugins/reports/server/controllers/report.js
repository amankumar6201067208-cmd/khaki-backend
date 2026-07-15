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

  async slots(ctx) {
    try {
      const slots = await distinctSlots(strapi, ctx.query);
      ctx.body = { slots };
    } catch (err) {
      // @ts-ignore
      return ctx.throw(err.status || 500, err.message);
    }
  },

  async dates(ctx) {
    try {
      const dates = await distinctDates(strapi, ctx.query);
      ctx.body = { dates };
    } catch (err) {
      // @ts-ignore
      return ctx.throw(err.status || 500, err.message);
    }
  },

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
