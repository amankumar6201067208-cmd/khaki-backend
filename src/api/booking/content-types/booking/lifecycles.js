"use strict";

const { confirmBookingOnce, BOOKING } = require("../../../../utils/confirmBooking");

/**
 * Fires on SINGULAR updates (Strapi admin panel edits). The PayU controllers
 * flip status with updateMany() which does NOT trigger afterUpdate — so this
 * hook only handles the MANUAL VERIFY case: an admin sets Bookingstatus -> paid
 * for a booking whose PayU callback never landed. confirmBookingOnce() sends
 * the confirmation email + reduces seats exactly once (idempotent).
 */
module.exports = {
  async afterUpdate(event) {
    const { result } = event;
    if (result?.Bookingstatus !== "paid") return;
    try {
      await confirmBookingOnce(strapi, BOOKING, result.bookingId, {});
    } catch (err) {
      strapi.log.error(
        `[booking.afterUpdate] confirm failed for ${result?.bookingId}: ${err.message}`,
      );
    }
  },
};
