"use strict";

module.exports = {
  async create(ctx) {
    try {
      const data = ctx.request.body;

      const donationId = "DON" + Date.now();

      const donation = await strapi.entityService.create(
        "api::donation-booking.donation-booking",
        {
          data: {
            donationId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            pan: data.pan,
            amount: data.amount,
            comments: data.comments,
            paymentStatus: "pending",
          },
        }
      );

      ctx.send({
        donationId,
        amount: donation.amount,
      });

    } catch (err) {
      ctx.throw(500, err);
    }
  },
};