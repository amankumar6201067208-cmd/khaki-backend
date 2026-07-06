"use strict";

const crypto = require("crypto");
const { runWithLock } = require("../../../utils/asyncLock");
const {
  sendEventConfirmation,
} = require("../../../utils/sendEventConfirmation");

const reducePublicSeats = async (
  tourSlug,
  dateString,
  slotTime,
  ticketsToReduce,
) => {
  if (!tourSlug) return;
  const normalizeTime = (t) => (t ? t.substring(0, 5) : "");
  const normalizedSlotTime = normalizeTime(slotTime);

  const activities = await strapi
    .documents("api::public-walk-and-event.public-walk-and-event")
    .findMany({
      filters: { Slug: tourSlug },
      populate: { BookingSlots: { populate: { Slots: true } } },
      status: "published",
    });

  const activity = activities?.[0];
  if (activity && activity.BookingSlots) {
    const bookingDate = new Date(dateString).toDateString();
    const updatedBookingSlots = activity.BookingSlots.map((component) => {
      if (new Date(component.TourDate).toDateString() !== bookingDate) {
        return {
          __component: "walk-event-trip.booking-slots",
          TourDate: component.TourDate,
          Slots: component.Slots
            ? {
                TourTime: component.Slots.TourTime,
                availableTickets: String(component.Slots.availableTickets),
              }
            : null,
        };
      }
      if (
        component.Slots &&
        normalizeTime(component.Slots.TourTime) === normalizedSlotTime
      ) {
        const currentSeats = Number(component.Slots.availableTickets);
        const newSeats = Math.max(0, currentSeats - ticketsToReduce);
        return {
          __component: "walk-event-trip.booking-slots",
          TourDate: component.TourDate,
          Slots: {
            TourTime: component.Slots.TourTime,
            availableTickets: String(newSeats),
          },
        };
      }
      return {
        __component: "walk-event-trip.booking-slots",
        TourDate: component.TourDate,
        Slots: component.Slots
          ? {
              TourTime: component.Slots.TourTime,
              availableTickets: String(component.Slots.availableTickets),
            }
          : null,
      };
    });

    await strapi
      .documents("api::public-walk-and-event.public-walk-and-event")
      .update({
        documentId: activity.documentId,
        // @ts-ignore
        data: { BookingSlots: updatedBookingSlots },
      });

    await strapi
      .documents("api::public-walk-and-event.public-walk-and-event")
      .publish({ documentId: activity.documentId });
  }
};

module.exports = {
  // CREATE EVENT PAYMENT
  async create(ctx) {
    try {
      const { amount, firstname, email, phone, productinfo, bookingId } =
        ctx.request.body;
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
        .query("api::public-event-booking.public-event-booking")
        .findOne({ where: { bookingId } });

      if (!eventBooking) {
        return ctx.redirect(
          `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}`,
        );
      }

      //  ATOMIC IDEMPOTENCY GUARD — flip to "paid" only if not already; only
      // one duplicate/concurrent call wins and runs the email + seat reduction.
      const { count } = await strapi.db
        .query("api::public-event-booking.public-event-booking")
        .updateMany({
          where: { bookingId, Bookingstatus: { $ne: "paid" } },
          data: { Bookingstatus: "paid" },
        });

      if (count === 0) {
        return ctx.redirect(
          `${frontendUrl}/thank-you?bookingId=${bookingId}&status=paid&txnid=${txnid}&tourSlug=${eventBooking.tourSlug}`,
        );
      }

      //  EMAIL from khakilab — picks Online (talk) vs Offline (event)
      // template by the activity's EventType. Non-blocking.
      try {
        await sendEventConfirmation(strapi, eventBooking);
      } catch (emailErr) {
        // @ts-ignore
        console.error(" Event booking email failed:", emailErr.message);
      }

      const ticketsToReduce = Number(
        eventBooking.totalParticipants || eventBooking.tickets || 1,
      );
      // Same lock key as walk so event + walk can't oversell the same slot.
      await runWithLock(`pubwalk:${eventBooking.tourSlug}`, () =>
        reducePublicSeats(
          eventBooking.tourSlug,
          eventBooking.date,
          eventBooking.slot,
          ticketsToReduce,
        ),
      );

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
        await strapi.db
          .query("api::public-event-booking.public-event-booking")
          .update({
            where: { bookingId },
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
