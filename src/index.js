"use strict";

const { errors } = require("@strapi/utils");

// Content types with scheduled publishing + their date field.
const SCHEDULED_DATE_FIELD = {
  "api::trip.trip": "publishDate",
};

module.exports = {
  register(/* { strapi } */) {},

  bootstrap({ strapi }) {
    // Block manually publishing an item whose publish date is in the future —
    // it must go live automatically at that time (via the cron), not early.
    // The cron only publishes items whose date has already passed, so its
    // publish() calls are never blocked here.
    strapi.documents.use(async (context, next) => {
      if (context.action !== "publish") return next();

      const field = SCHEDULED_DATE_FIELD[context.uid];
      if (!field) return next();

      const documentId = context.params?.documentId;
      if (documentId) {
        const draft = await strapi.documents(context.uid).findOne({
          documentId,
          status: "draft",
          fields: [field],
        });

        const when = draft?.[field];
        if (when && new Date(when) > new Date()) {
          throw new errors.ApplicationError(
            "This item has a future publish date — it will go live automatically at that date & time. Clear the future date if you want to publish it now.",
          );
        }
      }

      return next();
    });
  },
};
