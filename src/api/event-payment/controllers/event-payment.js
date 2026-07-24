"use strict";

const crypto = require("crypto");
const {
  confirmBookingOnce,
  findBooking,
  EVENT,
} = require("../../../utils/confirmBooking");

module.exports = {
  // CREATE EVENT PAYMENT
  async create(ctx) {
    try {
      const { firstname, email, phone, productinfo, bookingId } =
        ctx.request.body;

      const found = await findBooking(strapi, bookingId);
      if (!found) {
        return ctx.badRequest("Unknown booking");
      }
      const amount = Number(found.record.totalAmount || 0).toFixed(2);

      //  SEPARATE PAYU ACCOUNT FOR EVENTS.
      const key = process.env.EVENT_PAYU_KEY || process.env.PAYU_KEY;
      const salt = process.env.EVENT_PAYU_SALT || process.env.PAYU_SALT;
      const payuBaseUrl = process.env.PAYU_BASE_URL;
      const backendUrl = process.env.BACKEND_URL;

      const txnid = "evt_" + Date.now();

      const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${bookingId}||||||||||${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      ctx.send({
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        udf1: bookingId,
        hash,
        payuBaseUrl,
        surl: `${backendUrl}/api/event-payment/success`,
        furl: `${backendUrl}/api/event-payment/failure`,
      });
    } catch (err) {
      ctx.throw(500, "Event payment creation failed");
    }
  },

  // EVENT PAYMENT SUCCESS
  async success(ctx) {
    try {
      const {
        status,
        firstname,
        amount,
        txnid,
        hash,
        key,
        productinfo,
        email,
        udf1,
      } = ctx.request.body;

      const bookingId = udf1;
      // Must match the salt used in create() above.
      const salt = process.env.EVENT_PAYU_SALT || process.env.PAYU_SALT;
      const frontendUrl = process.env.FRONTEND_URL;

      //  HASH VERIFY (event merchant salt)
      const reverseString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const calculatedHash = crypto
        .createHash("sha512")
        .update(reverseString)
        .digest("hex");

      if (calculatedHash !== hash) {
        return ctx.redirect(`${frontendUrl}/failed?error=hash_mismatch`);
      }

      const eventBooking = await strapi.db
        .query(EVENT)
        .findOne({ where: { bookingId } });

      if (!eventBooking) {
        return ctx.redirect(
          `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}`,
        );
      }

      const { count } = await strapi.db.query(EVENT).updateMany({
        where: { bookingId, Bookingstatus: { $ne: "paid" } },
        data: { Bookingstatus: "paid" },
      });
      if (count > 0) {
        await confirmBookingOnce(strapi, EVENT, bookingId, { txnid });
      }

      return ctx.redirect(
        `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}&tourSlug=${eventBooking.tourSlug}`,
      );
    } catch (error) {
      console.error("=== EVENT PAYMENT SUCCESS ERROR ===", error);
      ctx.throw(500, "Event verification failed");
    }
  },
  // EVENT PAYMENT FAILURE
  async failure(ctx) {
    try {
      const bookingId = ctx.request.body.udf1;
      const frontendUrl = process.env.FRONTEND_URL;

      try {
        await strapi.db.query(EVENT).updateMany({
          where: { bookingId, Bookingstatus: { $ne: "paid" } },
          data: { Bookingstatus: "failed" },
        });
      } catch (_) {}

      return ctx.redirect(
        `${frontendUrl}/thank-you?bookingId=${bookingId}&status=failed`,
      );
    } catch (error) {
      console.error("=== EVENT PAYMENT FAILURE ERROR ===", error);
      ctx.throw(500, "Event failure handling failed");
    }
  },
};
