"use strict";

const {
  sendEventConfirmation,
} = require("../../../utils/sendEventConfirmation");
// Reduction algorithm lives in one place; the free-booking flow reuses it.
const { reducePublicSeats } = require("../../../utils/confirmBooking");
const { calcEventAmount } = require("../../../utils/pricing");

// CONTROLLER
module.exports = {
  async create(ctx) {
    try {
      const data = ctx.request.body;

      const bookingId = "PEB" + Date.now();

      const passengers = Array.isArray(data.passengers) ? data.passengers : [];
      const tickets = passengers.length || Number(data.tickets) || 1;

      const totalAmount = await calcEventAmount(strapi, {
        tourSlug: data.tourSlug,
        tickets,
      });

      const isFree = Number(totalAmount) === 0;

      // CREATE BOOKING

      const booking = await strapi.entityService.create(
        "api::public-event-booking.public-event-booking",
        {
          data: {
            bookingId,
            tourSlug: data.tourSlug.toLowerCase(),
            date: data.date,
            slot: data.slot,
            tickets,
            totalAmount,
            tourTitle: data.tourTitle,
            startingPoint: data.startingPoint,
            contactName: data.contact.name,
            contactEmail: data.contact.email,
            contactPhone: data.contact.phone,
            CountryCode: data.contact.countryCode,
            passengers,

            // FREE → confirmed | PAID → pending
            Bookingstatus: isFree ? "confirmed" : "pending",
          },
        },
      );

      // FREE BOOKING FLOW

      if (isFree) {
        try {
          console.log(" FREE BOOKING CONFIRMED");

          //  Confirmation from khakilab (Online talk vs Offline event template).
          await sendEventConfirmation(strapi, booking);

          console.log(" Free booking email sent");

          //  REDUCE SEATS
          const ticketsToReduce = Number(
            booking.totalParticipants || booking.tickets || 1,
          );

          await reducePublicSeats(
            strapi,
            booking.tourSlug,
            booking.date,
            booking.slot,
            ticketsToReduce,
          );
        } catch (err) {
          console.error(" Free booking flow error:", err);
        }
      }

      // RESPONSE
      ctx.send({
        bookingId: booking.bookingId,
        amount: booking.totalAmount,
        isFree,
      });
    } catch (error) {
      console.error(" PUBLIC EVENT CREATE ERROR:", error);
      ctx.throw(500, error);
    }
  },
};
