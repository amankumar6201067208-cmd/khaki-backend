"use strict";

const { calcWalkAmount } = require("../../../utils/pricing");

module.exports = {
  async create(ctx) {
    try {
      const data = ctx.request.body;

      const bookingId = "PWB" + Date.now();
      
      const passengers = Array.isArray(data.passengers) ? data.passengers : [];
      const tickets = passengers.length || Number(data.tickets) || 1;


      const { totalAmount } = await calcWalkAmount(strapi, {
        tourSlug: data.tourSlug,
        date: data.date,
        slot: data.slot,
        participants: passengers,
      });

      const isFree = Number(totalAmount) === 0;

      const booking = await strapi.entityService.create(
        "api::public-walk-booking.public-walk-booking",
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

            Bookingstatus: isFree ? "confirmed" : "pending",
          },
        }
      );

      // FREE EVENT → direct confirm + seat reduce
      if (isFree) {
        console.log("FREE BOOKING CONFIRMED");
      }

      ctx.send({
        bookingId: booking.bookingId,
        amount: booking.totalAmount,
        isFree,
      });

    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async calculate(ctx) {
    try {
      const { tourSlug, date, slot, participants } = ctx.request.body;

      if (!tourSlug || !date || !slot || !participants?.length) {
        return ctx.badRequest("Missing required fields");
      }

      const { totalAmount, remainingDiscountQuota } = await calcWalkAmount(
        strapi,
        { tourSlug, date, slot, participants },
      );

      return ctx.send({ totalAmount, remainingDiscountQuota });
    } catch (error) {
      console.error("=== CALCULATE ERROR ===", error);
      ctx.throw(500, "Calculation failed");
    }
  },
};
