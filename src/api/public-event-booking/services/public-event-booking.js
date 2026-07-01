'use strict';

/**
 * public-event-booking service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::public-event-booking.public-event-booking');
