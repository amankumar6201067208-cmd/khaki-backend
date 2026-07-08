"use strict";
const crypto = require("crypto");
const {
  confirmBookingOnce,
  BOOKING,
  EVENT,
  WALK,
} = require("../../../utils/confirmBooking");

module.exports = {
  async create(ctx) {
    try {
      const { amount, firstname, email, phone, productinfo, bookingId } =
        ctx.request.body;

      const key = process.env.PAYU_KEY;
      const salt = process.env.PAYU_SALT;
      const payuBaseUrl = process.env.PAYU_BASE_URL;
      const backendUrl = process.env.BACKEND_URL;

      const txnid = "txn_" + Date.now();

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
        surl: `${backendUrl}/api/payment/success`,
        furl: `${backendUrl}/api/payment/failure`,
      });
    } catch (err) {
      ctx.throw(500, "Payment creation failed");
    }
  },

  // PAYMENT SUCCESS
  // PayU POSTs here (surl). We verify the hash, flip status -> paid atomically,
  // then let confirmBookingOnce() do the email + seat reduction exactly once.
  async success(ctx) {
    try {
      const response = ctx.request.body;

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
      } = response;

      const bookingId = udf1;
      const salt = process.env.PAYU_SALT;
      const frontendUrl = process.env.FRONTEND_URL;

      //  HASH VERIFY — never trust the browser POST without this.
      const reverseString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const calculatedHash = crypto
        .createHash("sha512")
        .update(reverseString)
        .digest("hex");

      if (calculatedHash !== hash) {
        return ctx.redirect(`${frontendUrl}/failed?error=hash_mismatch`);
      }

      const thankYou = (slug) =>
        ctx.redirect(
          `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}${
            slug ? `&tourSlug=${slug}` : ""
          }`,
        );

      //  GROUP TOUR BOOKING
      const booking = await strapi.db
        .query(BOOKING)
        .findOne({ where: { bookingId } });
      if (booking) {
        // ATOMIC IDEMPOTENCY GUARD — only one call wins the paid-flip.
        const { count } = await strapi.db.query(BOOKING).updateMany({
          where: { bookingId, Bookingstatus: { $ne: "paid" } },
          data: { Bookingstatus: "paid" },
        });
        if (count > 0) {
          await confirmBookingOnce(strapi, BOOKING, bookingId, { txnid });
        }
        return thankYou(booking.tourSlug);
      }

      //  PUBLIC EVENT BOOKING (safety net — events normally use /event-payment)
      const eventBooking = await strapi.db
        .query(EVENT)
        .findOne({ where: { bookingId } });
      if (eventBooking) {
        const { count } = await strapi.db.query(EVENT).updateMany({
          where: { bookingId, Bookingstatus: { $ne: "paid" } },
          data: { Bookingstatus: "paid" },
        });
        if (count > 0) {
          await confirmBookingOnce(strapi, EVENT, bookingId, { txnid });
        }
        return thankYou(eventBooking.tourSlug);
      }

      //  PUBLIC WALK BOOKING
      const walkBooking = await strapi.db
        .query(WALK)
        .findOne({ where: { bookingId } });
      if (walkBooking) {
        const { count } = await strapi.db.query(WALK).updateMany({
          where: { bookingId, Bookingstatus: { $ne: "paid" } },
          data: { Bookingstatus: "paid" },
        });
        if (count > 0) {
          await confirmBookingOnce(strapi, WALK, bookingId, { txnid });
        }
        return thankYou(walkBooking.tourSlug);
      }

      // Fallback — no matching booking record.
      return ctx.redirect(
        `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid`,
      );
    } catch (error) {
      console.error("=== PAYMENT SUCCESS ERROR ===", error);
      ctx.throw(500, "Verification failed");
    }
  },

  // PAYMENT FAILURE
  // Mark the booking failed — but NEVER overwrite an already-paid booking (a
  // late/duplicate furl must not undo a real success). No email is ever sent.
  async failure(ctx) {
    try {
      const response = ctx.request.body;
      const bookingId = response.udf1;
      const frontendUrl = process.env.FRONTEND_URL;

      // Safe to run all three — only the matching type has this bookingId.
      for (const uid of [BOOKING, EVENT, WALK]) {
        try {
          await strapi.db.query(uid).updateMany({
            where: { bookingId, Bookingstatus: { $ne: "paid" } },
            data: { Bookingstatus: "failed" },
          });
        } catch (_) {}
      }

      return ctx.redirect(
        `${frontendUrl}/thank-you?bookingId=${bookingId}&status=failed`,
      );
    } catch (error) {
      console.error("=== PAYMENT FAILURE ERROR ===", error);
      ctx.throw(500, "Failure handling failed");
    }
  },
};
