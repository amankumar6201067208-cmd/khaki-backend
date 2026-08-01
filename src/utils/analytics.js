"use strict";
const BOOKING_TYPES = [
  "api::booking.booking",
  "api::public-walk-booking.public-walk-booking",
  "api::public-event-booking.public-event-booking",
];

// Cache the computed result briefly. The 3 homepage widgets each request this,
// and admins reload often — so at most one DB pass runs per CACHE_TTL_MS.
/** @type {{ data: any, at: number }} */
let _cache = { data: null, at: 0 };
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

async function fetchPaidBookings(strapi) {
  const out = [];
  for (const uid of BOOKING_TYPES) {
    const pageSize = 1000;
    let start = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await strapi.documents(uid).findMany({
        filters: { Bookingstatus: "paid" },
        fields: ["tourTitle", "totalAmount", "createdAt"],
        start,
        limit: pageSize,
      });
      out.push(...batch);
      if (batch.length < pageSize) break;
      start += pageSize;
    }
  }
  return out;
}

/**
 * Dashboard analytics for the admin homepage widgets.
 * @returns {Promise<{
 *   topByRevenue: {tour:string,revenue:number}[],
 *   topByBookings: {tour:string,count:number}[],
 *   monthly: {label:string,count:number,revenue:number}[],
 *   totals: {bookings:number,revenue:number}
 * }>}
 */
async function getAnalytics(strapi) {
  const nowMs = Date.now();
  if (_cache.data && nowMs - _cache.at < CACHE_TTL_MS) {
    return _cache.data;
  }

  const bookings = await fetchPaidBookings(strapi);

  // --- Top tours by revenue & by booking count ---
  const revByTour = {};
  const countByTour = {};
  for (const b of bookings) {
    const title = b.tourTitle || "Unknown";
    revByTour[title] = (revByTour[title] || 0) + Number(b.totalAmount || 0);
    countByTour[title] = (countByTour[title] || 0) + 1;
  }

  const topByRevenue = Object.entries(revByTour)
    .map(([tour, revenue]) => ({ tour, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topByBookings = Object.entries(countByTour)
    .map(([tour, count]) => ({ tour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // --- Last 6 months (bookings + revenue per month) ---
  const now = new Date();
  const monthly = [];
  const indexByKey = new Map();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    indexByKey.set(key, monthly.length);
    monthly.push({
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      count: 0,
      revenue: 0,
    });
  }

  for (const b of bookings) {
    if (!b.createdAt) continue;
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const idx = indexByKey.get(key);
    if (idx !== undefined) {
      monthly[idx].count += 1;
      monthly[idx].revenue += Number(b.totalAmount || 0);
    }
  }

  const totals = {
    bookings: bookings.length,
    revenue: bookings.reduce((s, b) => s + Number(b.totalAmount || 0), 0),
  };

  const result = { topByRevenue, topByBookings, monthly, totals };
  _cache = { data: result, at: nowMs };
  return result;
}

module.exports = { getAnalytics };
