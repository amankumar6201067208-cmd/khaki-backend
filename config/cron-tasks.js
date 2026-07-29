"use strict";

module.exports = {
  autoPublishTours: {
    task: async ({ strapi }) => {
      try {
        const now = new Date().toISOString();

        // documentIds that already have a published version (skip these).
        const published = await strapi.documents("api::trip.trip").findMany({
          status: "published",
          fields: ["documentId"],
          limit: 1000,
        });
        const publishedIds = new Set(published.map((d) => d.documentId));

        const dueDrafts = await strapi.documents("api::trip.trip").findMany({
          status: "draft",
          filters: { publishDate: { $lte: now } },
          fields: ["documentId", "Title", "publishDate"],
          limit: 1000,
        });

        for (const d of dueDrafts) {
          if (publishedIds.has(d.documentId)) continue; // already live

          await strapi.documents("api::trip.trip").publish({
            documentId: d.documentId,
          });

          strapi.log.info(
            `[auto-publish] Published trip "${d.Title}" (${d.documentId}) — scheduled ${d.publishDate}`,
          );
        }
      } catch (err) {
        // @ts-ignore
        strapi.log.error(`[auto-publish] failed: ${err.message}`);
      }
    },
    options: {
      rule: "* * * * *",
    },
  },
};
