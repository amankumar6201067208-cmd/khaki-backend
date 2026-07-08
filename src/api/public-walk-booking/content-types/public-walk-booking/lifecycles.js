"use strict";

const { confirmBookingOnce, WALK } = require("../../../../utils/confirmBooking");

/**
 * Manual-verify hook for public walk bookings. See booking/lifecycles.js —
 * the PayU controllers use updateMany() (no afterUpdate), so this only runs
 * when an admin manually flips Bookingstatus -> paid in the panel.
 */
module.exports = {
  async afterUpdate(event) {
    const { result } = event;
    if (result?.Bookingstatus !== "paid") return;
    try {
      await confirmBookingOnce(strapi, WALK, result.bookingId, {});
    } catch (err) {
      strapi.log.error(
        `[public-walk-booking.afterUpdate] confirm failed for ${result?.bookingId}: ${err.message}`,
      );
    }
  },
};
