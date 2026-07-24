"use strict";

const { calcGroupTourAmount } = require("../../../utils/pricing");

module.exports = {

  async createBooking(ctx) {
    try {

      const data = ctx.request.body;

      const totalAmount = await calcGroupTourAmount(strapi, {
        tourSlug: data.tourSlug,
        tickets: data.tickets,
      });

      const booking = await strapi.entityService.create(

        "api::booking.booking",

        {
          data: {
            bookingId: "BK" + Date.now(),
            tourSlug: data.tourSlug.toLowerCase(), // ensure lowercase
            date: data.date,
            slot: data.slot,
            tickets: data.tickets,
            tourTitle: data.tourTitle,
            startingPoint: data.startingPoint,
            totalAmount,
            contactName: data.contact.name,
            contactEmail: data.contact.email,
            contactPhone: data.contact.phone,
            CountryCode: data.contact.countryCode,
            passengers: data.passengers,
            Bookingstatus: "pending",
          }
        }
      );

      ctx.send({
        bookingId: booking.bookingId,
        amount: booking.totalAmount
      });

    } catch (error) {
      ctx.throw(500, error);
    }
  }

};