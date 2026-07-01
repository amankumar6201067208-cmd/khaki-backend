'use strict';

/**
 * donation-booking service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::donation-booking.donation-booking');
