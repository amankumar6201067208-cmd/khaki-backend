"use strict";

module.exports = {
  async create(ctx) {
    try {
      const data = ctx.request.body;

      const bookingId = "PWB" + Date.now();

      const isFree = Number(data.totalAmount) === 0;

      const booking = await strapi.entityService.create(
        "api::public-walk-booking.public-walk-booking",
        {
          data: {
            bookingId,
            tourSlug: data.tourSlug.toLowerCase(),
            date: data.date,
            slot: data.slot,
            tickets: data.tickets,
            totalAmount: data.totalAmount,
            tourTitle: data.tourTitle,
            startingPoint: data.startingPoint,
            contactName: data.contact.name,
            contactEmail: data.contact.email,
            contactPhone: data.contact.phone,

            passengers: data.passengers,

            Bookingstatus: isFree ? "confirmed" : "pending",
          },
        }
      );

      // ✅ FREE EVENT → direct confirm + seat reduce
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

  // =====================================================
  // POST /api/public-walk-booking/calculate
  //
  // Submit se pehle frontend call karta hai
  // Fresh DB se discountUsedCount fetch hota hai
  // Taki stale frontend data pe depend na karna pade
  // =====================================================
  async calculate(ctx) {
    try {
      const { tourSlug, date, slot, participants, pricePerPerson } =
        ctx.request.body;

      if (!tourSlug || !date || !slot || !participants?.length) {
        return ctx.badRequest("Missing required fields");
      }

      const normalizeTime = (t) => (t ? t.substring(0, 5) : "");
      const normalizedSlotTime = normalizeTime(slot);
      const bookingDate = new Date(date).toDateString();

      // ✅ Fresh fetch — hamesha latest discountUsedCount milega
      const activities = await strapi
        .documents("api::public-walk-and-event.public-walk-and-event")
        .findMany({
          filters: { Slug: tourSlug },
          populate: {
            BookingSlots: { populate: { Slots: true } },
          },
          status: "published",
        });

      const activity = activities?.[0];

      let currentDiscountUsed = 0;
      const maxDiscount = 3;

      if (activity?.BookingSlots) {
        const matchingSchedule = activity.BookingSlots.find(
          (c) => new Date(c.TourDate).toDateString() === bookingDate
        );

        if (matchingSchedule?.Slots) {
          const isMatchingSlot =
            normalizeTime(matchingSchedule.Slots.TourTime) === normalizedSlotTime;

          if (isMatchingSlot) {
            // 🔑 Fresh value from DB — refresh karo ya na karo, sahi milega
            currentDiscountUsed = Number(matchingSchedule.Slots.discountUsedCount || 0);
          }
        }
      }

      // Real remaining discount quota
      let remainingDiscount = Math.max(0, maxDiscount - currentDiscountUsed);
      let totalAmount = 0;

      for (const p of participants) {
        const price = Number(pricePerPerson) || 0;
        const isEligible =
          p?.category === "student" || p?.category === "senior";

        if (isEligible && remainingDiscount > 0) {
          totalAmount += price - (price * 25) / 100; // 25% discount
          remainingDiscount--;
        } else {
          totalAmount += price;
        }
      }

      console.log(
        `💰 Calculate: slug=${tourSlug}, discountUsed=${currentDiscountUsed}, remaining=${maxDiscount - currentDiscountUsed}, total=₹${totalAmount}`
      );

      // remainingDiscountQuota frontend ko bhejo — UI real-time quota dikhayega
      const finalRemainingQuota = Math.max(0, maxDiscount - currentDiscountUsed);
      return ctx.send({ totalAmount, remainingDiscountQuota: finalRemainingQuota });
    } catch (error) {
      console.error("=== CALCULATE ERROR ===", error);
      ctx.throw(500, "Calculation failed");
    }
  },
};