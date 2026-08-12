"use strict";
const TYPES = [
  { key: "group",   uid: "api::booking.booking",                           titleField: "tourTitle", paid: true },
  { key: "walk",    uid: "api::public-walk-booking.public-walk-booking",    titleField: "tourTitle", paid: true },
  { key: "event",   uid: "api::public-event-booking.public-event-booking",  titleField: "tourTitle", paid: true },
  { key: "private", uid: "api::private-tour-booking.private-tour-booking",   titleField: "tourName",  paid: false },
];

/** @type {{ data: any, at: number }} */
let _cache = { data: null, at: 0 };
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

async function fetchAll(strapi, uid, filters, fields) {
  const out = [];
  const pageSize = 1000;
  let start = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await strapi.documents(uid).findMany({
      filters,
      fields,
      start,
      limit: pageSize,
    });
    out.push(...batch);
    if (batch.length < pageSize) break;
    start += pageSize;
  }
  return out;
}

// "YYYY-MM" bucket key for a date.
const monthKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

// Top 5 tours from a { tourName: count } map, shaped as {tour, count}.
function top5Counts(map) {
  return Object.entries(map)
    .map(([tour, count]) => ({ tour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// Top 5 tours from a { tourName: revenue } map, shaped as {tour, revenue}.
function top5Revenue(map) {
  return Object.entries(map)
    .map(([tour, revenue]) => ({ tour, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

/**
 * @returns {Promise<{
 *   months: {key:string,label:string}[],
 *   byType: Record<string, Record<string, {topByBookings:any[],topByRevenue:any[]}>>,
 *   revenueMonthly: {label:string,revenue:number}[]
 * }>}
 */
async function getAnalytics(strapi) {
  const nowMs = Date.now();
  if (_cache.data && nowMs - _cache.at < CACHE_TTL_MS) {
    return _cache.data;
  }

  // --- Build the last-6-months window (oldest → newest) ---
  const now = new Date();
  const months = []; // [{ key, label }]
  const monthKeys = [];
  const revenueMonthly = []; // [{ label, revenue }]
  const revIndexByKey = new Map();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    months.push({ key, label });
    monthKeys.push(key);
    revIndexByKey.set(key, revenueMonthly.length);
    revenueMonthly.push({ label, revenue: 0 });
  }
  const inWindow = new Set(monthKeys);

  // --- Per-type: top 5 by bookings & by revenue per month (+ all-website revenue) ---
  /** @type {Record<string, Record<string, {topByBookings:any[],topByRevenue:any[]}>>} */
  const byType = {};

  for (const t of TYPES) {
    const filters = t.paid ? { Bookingstatus: "paid" } : {};
    const rows = await fetchAll(strapi, t.uid, filters, [
      t.titleField,
      "totalAmount",
      "createdAt",
    ]);

    // month key → { tourName → count } and { tourName → revenue }
    const countByMonth = {};
    const revByMonth = {};
    for (const key of monthKeys) {
      countByMonth[key] = {};
      revByMonth[key] = {};
    }

    for (const r of rows) {
      if (!r.createdAt) continue;
      const key = monthKey(new Date(r.createdAt));
      if (!inWindow.has(key)) continue;

      const title = r[t.titleField] || "Unknown";
      const amount = Number(r.totalAmount || 0);
      countByMonth[key][title] = (countByMonth[key][title] || 0) + 1;
      revByMonth[key][title] = (revByMonth[key][title] || 0) + amount;

      // All-website revenue: only paid types contribute actual collected money.
      if (t.paid) {
        revenueMonthly[revIndexByKey.get(key)].revenue += amount;
      }
    }

    /** @type {Record<string, {topByBookings:any[],topByRevenue:any[]}>} */
    const byMonth = {};
    for (const key of monthKeys) {
      byMonth[key] = {
        topByBookings: top5Counts(countByMonth[key]),
        topByRevenue: top5Revenue(revByMonth[key]),
      };
    }
    byType[t.key] = byMonth;
  }

  const result = { months, byType, revenueMonthly };
  _cache = { data: result, at: nowMs };
  return result;
}

module.exports = { getAnalytics };
