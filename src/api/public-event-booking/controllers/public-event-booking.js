"use strict";

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
      populate: {
        BookingSlots: { populate: { Slots: true } },
      },
      status: "published",
    });

  const activity = activities?.[0];

  if (activity && activity.BookingSlots) {
    const bookingDate = new Date(dateString).toDateString();

    const updatedBookingSlots = activity.BookingSlots.map((component) => {
      // If date not match → keep same
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

      // If slot match → reduce seats
      if (
        component.Slots &&
        normalizeTime(component.Slots.TourTime) === normalizedSlotTime
      ) {
        const currentSeats = Number(component.Slots.availableTickets);
        const newSeats = Math.max(0, currentSeats - ticketsToReduce);

        console.log(` Free booking seat reduce: ${currentSeats} → ${newSeats}`);

        return {
          __component: "walk-event-trip.booking-slots",
          TourDate: component.TourDate,
          Slots: {
            TourTime: component.Slots.TourTime,
            availableTickets: String(newSeats),
          },
        };
      }

      // Default return
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

    //  Update + Publish
    await strapi
      .documents("api::public-walk-and-event.public-walk-and-event")
      .update({
        documentId: activity.documentId,
        data: {
          // @ts-ignore
          BookingSlots: updatedBookingSlots,
        },
      });

    await strapi
      .documents("api::public-walk-and-event.public-walk-and-event")
      .publish({
        documentId: activity.documentId,
      });

    console.log(" Free booking seats updated & published");
  } else {
    console.warn(" No activity found for slug:", tourSlug);
  }
};

// CONTROLLER
module.exports = {
  async create(ctx) {
    try {
      const data = ctx.request.body;

      const bookingId = "PEB" + Date.now();
      const isFree = Number(data.totalAmount) === 0;

      // CREATE BOOKING

      const booking = await strapi.entityService.create(
        "api::public-event-booking.public-event-booking",
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
