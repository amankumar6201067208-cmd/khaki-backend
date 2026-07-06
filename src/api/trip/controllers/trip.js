'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::trip.trip', ({ strapi }) => ({
  async find(ctx) {
    // Default to newest-first unless the client explicitly asks for a sort
    if (!ctx.query.sort) {
      ctx.query.sort = 'createdAt:desc';
    }
    return await super.find(ctx);
  },
}));
