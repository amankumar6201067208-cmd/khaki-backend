"use strict";

const { confirmBookingOnce, EVENT } = require("../../../../utils/confirmBooking");

/**
 * Manual-verify hook for public event bookings. See booking/lifecycles.js —
 * the PayU controllers use updateMany() (no afterUpdate), so this only runs
 * when an admin manually flips Bookingstatus -> paid in the panel.
 */
module.exports = {
  async afterUpdate(event) {
    const { result } = event;
    if (result?.Bookingstatus !== "paid") return;
    try {
      await confirmBookingOnce(strapi, EVENT, result.bookingId, {});
    } catch (err) {
      strapi.log.error(
        `[public-event-booking.afterUpdate] confirm failed for ${result?.bookingId}: ${err.message}`,
      );
    }
  },
};
