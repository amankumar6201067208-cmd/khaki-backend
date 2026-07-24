"use strict";

const normalizeTime = (t) => (t ? t.substring(0, 5) : "");

const MAX_DISCOUNT_PER_SLOT = 3;
const DISCOUNT_PERCENT = 25;

/** Published group tour (trip) by slug. */
async function getTrip(strapi, tourSlug) {
  const trips = await strapi.documents("api::trip.trip").findMany({
    filters: { Slug: String(tourSlug || "").toLowerCase() },
    status: "published",
  });
  return trips?.[0] || null;
}

/** Published public walk/event activity by slug. */
async function getActivity(strapi, tourSlug, withSlots = false) {
  const activities = await strapi
    .documents("api::public-walk-and-event.public-walk-and-event")
    .findMany({
      filters: { Slug: String(tourSlug || "").toLowerCase() },
      ...(withSlots
        ? { populate: { BookingSlots: { populate: { Slots: true } } } }
        : {}),
      status: "published",
    });
  return activities?.[0] || null;
}

/**
 * Group tour: trip price × tickets.
 * @returns {Promise<number>}
 */
async function calcGroupTourAmount(strapi, { tourSlug, tickets }) {
  const trip = await getTrip(strapi, tourSlug);
  if (!trip) throw new Error(`Unknown tour: ${tourSlug}`);

  const price = Number(trip.Price) || 0;
  const qty = Math.max(0, Number(tickets) || 0);
  return price * qty;
}

/**
 * Public event: flat activity price × tickets (events have no discount).
 * @returns {Promise<number>}
 */
async function calcEventAmount(strapi, { tourSlug, tickets }) {
  const activity = await getActivity(strapi, tourSlug);
  if (!activity) throw new Error(`Unknown event: ${tourSlug}`);

  const price = Number(activity.Price) || 0;
  const qty = Math.max(0, Number(tickets) || 0);
  return price * qty;
}

/**
 * @returns {Promise<{ totalAmount: number, remainingDiscountQuota: number }>}
 */
async function calcWalkAmount(strapi, { tourSlug, date, slot, participants }) {
  const activity = await getActivity(strapi, tourSlug, true);
  if (!activity) throw new Error(`Unknown walk: ${tourSlug}`);

  const price = Number(activity.Price) || 0;

  // Discount already used on this date+slot.
  let currentDiscountUsed = 0;
  if (activity.BookingSlots && date && slot) {
    const bookingDate = new Date(date).toDateString();
    const normalizedSlotTime = normalizeTime(slot);

    const matching = activity.BookingSlots.find(
      (c) => new Date(c.TourDate).toDateString() === bookingDate,
    );

    if (
      matching &&
      matching.Slots &&
      normalizeTime(matching.Slots.TourTime) === normalizedSlotTime
    ) {
      currentDiscountUsed = Number(matching.Slots.discountUsedCount || 0);
    }
  }

  const remainingDiscountQuota = Math.max(
    0,
    MAX_DISCOUNT_PER_SLOT - currentDiscountUsed,
  );

  let remaining = remainingDiscountQuota;
  const list = Array.isArray(participants) ? participants : [];

  let totalAmount = 0;
  for (const p of list) {
    const eligible = p?.category === "student" || p?.category === "senior";
    if (eligible && remaining > 0) {
      totalAmount += price - (price * DISCOUNT_PERCENT) / 100;
      remaining--;
    } else {
      totalAmount += price;
    }
  }

  return { totalAmount, remainingDiscountQuota };
}

module.exports = {
  calcGroupTourAmount,
  calcEventAmount,
  calcWalkAmount,
};
