'use strict';

/**
 * private-tour-booking controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  'api::private-tour-booking.private-tour-booking',
  ({ strapi }) => ({
    async find(ctx) {
      // Default to newest-first unless the client explicitly asks for a sort
      if (!ctx.query.sort) {
        ctx.query.sort = 'createdAt:desc';
      }
      return await super.find(ctx);
    },
  })
);
