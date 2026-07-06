"use strict";

module.exports = {

  async createBooking(ctx) {
    try {
      
      const data = ctx.request.body;
       console.log (data, "data of booking");
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
            totalAmount: data.totalAmount,
            contactName: data.contact.name,
            contactEmail: data.contact.email,
            contactPhone: data.contact.phone,
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