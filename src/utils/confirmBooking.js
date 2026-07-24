"use strict";

const userEmail = require("./eventUserEmail");
const { runWithLock } = require("./asyncLock");
const { sendMail } = require("./mailer");
const { sendEventConfirmation } = require("./sendEventConfirmation");

const normalizeTime = (t) => (t ? t.substring(0, 5) : "");

const BOOKING = "api::booking.booking";
const EVENT = "api::public-event-booking.public-event-booking";
const WALK = "api::public-walk-booking.public-walk-booking";

// SEAT REDUCTION — GROUP TOUR (api::booking.booking -> api::trip.trip)
async function reduceGroupTourSeats(strapi, booking) {
  const { tourSlug, date, slot: slotTime, tickets } = booking;
  const normalizedSlotTime = normalizeTime(slotTime);

  const trips = await strapi.documents("api::trip.trip").findMany({
    filters: { Slug: tourSlug },
    populate: {
      GroupTourBookingDetails: {
        on: { "trip.schedule": { populate: { Slots: true } } },
      },
    },
    status: "published",
  });

  const trip = trips?.[0];
  if (!trip) {
    strapi.log.warn(`[confirmBooking] No trip found for slug: ${tourSlug}`);
    return;
  }

  const bookingDate = new Date(date).toDateString();
  const scheduleComponent = trip.GroupTourBookingDetails?.find(
    (c) => new Date(c.Date).toDateString() === bookingDate,
  );
  if (!scheduleComponent) {
    strapi.log.warn(`[confirmBooking] No matching schedule for date: ${date}`);
    return;
  }

  const matchingSlot = scheduleComponent.Slots?.find(
    (s) => normalizeTime(s.Time) === normalizedSlotTime,
  );
  if (!matchingSlot) {
    strapi.log.warn(
      `[confirmBooking] No matching slot for time: ${normalizedSlotTime}`,
    );
    return;
  }

  const currentSeats = Number(matchingSlot.availableSeats);
  const newSeats = Math.max(0, currentSeats - Number(tickets));

  const updatedBookingDetails = trip.GroupTourBookingDetails.map(
    (component) => {
      if (new Date(component.Date).toDateString() !== bookingDate) {
        return {
          __component: "trip.schedule",
          Date: component.Date,
          Slots: component.Slots.map((s) => ({
            Time: s.Time,
            availableSeats: String(s.availableSeats),
          })),
        };
      }
      return {
        __component: "trip.schedule",
        Date: component.Date,
        Slots: component.Slots.map((s) => {
          if (normalizeTime(s.Time) !== normalizedSlotTime) {
            return { Time: s.Time, availableSeats: String(s.availableSeats) };
          }
          return { Time: s.Time, availableSeats: String(newSeats) };
        }),
      };
    },
  );

  await strapi.documents("api::trip.trip").update({
    documentId: trip.documentId,
    data: { GroupTourBookingDetails: updatedBookingDetails },
  });
  await strapi.documents("api::trip.trip").publish({
    documentId: trip.documentId,
  });

  strapi.log.info(
    `[confirmBooking] Group seats ${currentSeats} -> ${newSeats} for ${tourSlug}`,
  );
}

// SEAT REDUCTION — PUBLIC EVENT (simple, no discount)
async function reducePublicSeats(
  strapi,
  tourSlug,
  dateString,
  slotTime,
  ticketsToReduce,
) {
  if (!tourSlug) return;
  const normalizedSlotTime = normalizeTime(slotTime);

  const activities = await strapi
    .documents("api::public-walk-and-event.public-walk-and-event")
    .findMany({
      filters: { Slug: tourSlug },
      populate: { BookingSlots: { populate: { Slots: true } } },
      status: "published",
    });

  const activity = activities?.[0];
  if (!activity || !activity.BookingSlots) return;

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
      data: { BookingSlots: updatedBookingSlots },
    });
  await strapi
    .documents("api::public-walk-and-event.public-walk-and-event")
    .publish({ documentId: activity.documentId });
}

// SEAT REDUCTION — PUBLIC WALK (with student/senior discount quota)
async function reduceWalkSeats(strapi, walkBooking) {
  const activities = await strapi
    .documents("api::public-walk-and-event.public-walk-and-event")
    .findMany({
      filters: { Slug: walkBooking.tourSlug },
      populate: { BookingSlots: { populate: { Slots: true } } },
      status: "published",
    });

  const activity = activities?.[0];
  if (!activity) return;

  const bookingDate = new Date(walkBooking.date).toDateString();
  const normalizedSlotTime = normalizeTime(walkBooking.slot);

  const updatedBookingSlots = activity.BookingSlots.map((component) => {
    // Non-matching date
    if (new Date(component.TourDate).toDateString() !== bookingDate) {
      return {
        __component: "walk-event-trip.booking-slots",
        TourDate: component.TourDate,
        Slots: component.Slots
          ? {
              TourTime: component.Slots.TourTime,
              availableTickets: String(component.Slots.availableTickets),
              discountUsedCount: Number(component.Slots.discountUsedCount || 0),
            }
          : null,
      };
    }

    // Matching date + matching slot
    if (
      component.Slots &&
      normalizeTime(component.Slots.TourTime) === normalizedSlotTime
    ) {
      const currentSeats = Number(component.Slots.availableTickets);
      const newSeats = Math.max(0, currentSeats - Number(walkBooking.tickets));

      // DISCOUNT LOGIC — fresh from DB, not from frontend
      let passengers = walkBooking.passengers || [];
      if (typeof passengers === "string") {
        try {
          passengers = JSON.parse(passengers);
        } catch {
          passengers = [];
        }
      }
      if (!Array.isArray(passengers)) passengers = [];

      const discountEligibleCount = passengers.filter(
        (p) => p?.category === "student" || p?.category === "senior",
      ).length;

      const currentDiscountUsed = Number(
        component.Slots.discountUsedCount || 0,
      );
      const maxDiscount = 3;
      const remainingDiscount = Math.max(0, maxDiscount - currentDiscountUsed);
      const appliedDiscount = Math.min(
        discountEligibleCount,
        remainingDiscount,
      );

      return {
        __component: "walk-event-trip.booking-slots",
        TourDate: component.TourDate,
        Slots: {
          TourTime: component.Slots.TourTime,
          availableTickets: String(newSeats),
          discountUsedCount: currentDiscountUsed + appliedDiscount,
        },
      };
    }

    // Matching date, different slot
    return {
      __component: "walk-event-trip.booking-slots",
      TourDate: component.TourDate,
      Slots: component.Slots
        ? {
            TourTime: component.Slots.TourTime,
            availableTickets: String(component.Slots.availableTickets),
            discountUsedCount: Number(component.Slots.discountUsedCount || 0),
          }
        : null,
    };
  });

  await strapi
    .documents("api::public-walk-and-event.public-walk-and-event")
    .update({
      documentId: activity.documentId,
      data: { BookingSlots: updatedBookingSlots },
    });
  await strapi
    .documents("api::public-walk-and-event.public-walk-and-event")
    .publish({ documentId: activity.documentId });
}

// EMAIL — pick the right template per booking type

async function sendConfirmationEmail(strapi, uid, record, txnid) {
  if (uid === EVENT) {
    // Online (talk) vs Offline (event) template chosen inside.
    await sendEventConfirmation(strapi, record);
    return;
  }
  // Group tour + Public walk share the khakitours confirmation template.
  await sendMail("khakitours", {
    to: record.contactEmail,
    subject: `Booking Confirmed for ${record.tourTitle}`,
    html: userEmail({ ...record, txnid }),
  });
}
// SEAT REDUCTION dispatcher (per booking type, under the right lock)
async function reduceSeats(strapi, uid, record) {
  if (uid === BOOKING) {
    await runWithLock(`trip:${record.tourSlug}`, () =>
      reduceGroupTourSeats(strapi, record),
    );
    return;
  }
  if (uid === EVENT) {
    const ticketsToReduce = Number(
      record.totalParticipants || record.tickets || 1,
    );
    await runWithLock(`pubwalk:${record.tourSlug}`, () =>
      reducePublicSeats(
        strapi,
        record.tourSlug,
        record.date,
        record.slot,
        ticketsToReduce,
      ),
    );
    return;
  }
  if (uid === WALK) {
    await runWithLock(`pubwalk:${record.tourSlug}`, () =>
      reduceWalkSeats(strapi, record),
    );
  }
}

/**
 * @param {object} strapi
 * @param {string} uid
 * @param {string} bookingId
 * @param {object} [opts]
 * @returns {Promise<boolean>}
 */
async function confirmBookingOnce(strapi, uid, bookingId, opts = {}) {
  if (!bookingId) return false;

  const record = await strapi.db.query(uid).findOne({ where: { bookingId } });
  if (!record) return false;

  // HARD RULE: only paid bookings ever trigger the confirmation.
  if (record.Bookingstatus !== "paid") return false;

  // Fast skip if already handled.
  if (record.confirmationEmailSent) return false;

  const { count } = await strapi.db.query(uid).updateMany({
    where: { bookingId, confirmationEmailSent: { $ne: true } },
    data: { confirmationEmailSent: true },
  });
  if (count === 0) return false; // someone else already claimed it

  try {
    await sendConfirmationEmail(strapi, uid, record, opts.txnid);
  } catch (emailErr) {
    strapi.log.error(
      // @ts-ignore
      `[confirmBooking] Email failed for ${bookingId}: ${emailErr.message}`,
    );
  }

  // Seat reduction — also non-blocking; log and move on.
  try {
    await reduceSeats(strapi, uid, record);
  } catch (seatErr) {
    strapi.log.error(
      // @ts-ignore
      `[confirmBooking] Seat reduction failed for ${bookingId}: ${seatErr.message}`,
    );
  }

  return true;
}

/**
 * Find a booking by its bookingId across the three booking types.
 * Used by the payment controllers to read the authoritative stored amount.
 * @returns {Promise<{ uid: string, record: object } | null>}
 */
async function findBooking(strapi, bookingId) {
  if (!bookingId) return null;
  for (const uid of [BOOKING, EVENT, WALK]) {
    const record = await strapi.db.query(uid).findOne({ where: { bookingId } });
    if (record) return { uid, record };
  }
  return null;
}

module.exports = {
  confirmBookingOnce,
  findBooking,
  reduceGroupTourSeats,
  reducePublicSeats,
  reduceWalkSeats,
  BOOKING,
  EVENT,
  WALK,
};
