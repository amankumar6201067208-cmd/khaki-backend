"use strict";

/**
 * Shared report-building logic used by both the public token-protected API
 * (`src/api/report`) and the admin-authenticated Reports plugin
 * (`src/plugins/reports`). Keeping it here avoids duplicating the query +
 * CSV logic in two places.
 */

// Per-report configuration: which model, which fields mean what, CSV columns.
const TYPES = {
  group: {
    model: "api::booking.booking",
    label: "Group Tour",
    dateField: "date",
    statusField: "Bookingstatus",
    tourFields: ["tourSlug", "tourTitle"],
    columns: [
      "bookingId", "tourTitle", "tourSlug", "date", "slot", "tickets",
      "totalAmount", "Bookingstatus", "contactName", "contactEmail",
      "contactPhone", "startingPoint", "passengers", "createdAt",
    ],
  },
  walk: {
    model: "api::public-walk-booking.public-walk-booking",
    label: "Public Walk",
    dateField: "date",
    statusField: "Bookingstatus",
    tourFields: ["tourSlug", "tourTitle"],
    columns: [
      "bookingId", "tourTitle", "tourSlug", "date", "slot", "tickets",
      "totalAmount", "Bookingstatus", "contactName", "contactEmail",
      "contactPhone", "startingPoint", "passengers", "createdAt",
    ],
  },
  event: {
    model: "api::public-event-booking.public-event-booking",
    label: "Public Event",
    dateField: "date",
    statusField: "Bookingstatus",
    tourFields: ["tourSlug", "tourTitle"],
    columns: [
      "bookingId", "tourTitle", "tourSlug", "date", "slot", "tickets",
      "totalAmount", "Bookingstatus", "contactName", "contactEmail",
      "contactPhone", "startingPoint", "passengers", "createdAt",
    ],
  },
  donation: {
    model: "api::donation-booking.donation-booking",
    label: "Donation",
    dateField: "createdAt",
    statusField: "paymentStatus",
    tourFields: [],
    columns: [
      "donationId", "name", "email", "phone", "address", "pan", "amount",
      "paymentStatus", "comments", "createdAt",
    ],
  },
  private: {
    model: "api::private-tour-booking.private-tour-booking",
    label: "Private Tour",
    dateField: "preferredDate",
    statusField: null,
    tourFields: ["tourName", "title"],
    columns: [
      "title", "tourName", "name", "email", "phone", "countryCode", "country",
      "preferredDate", "startTime", "endTime", "people", "totalAmount",
      "otherRequest", "acceptedTerms", "createdAt",
    ],
  },
};

// The set of types included when type=all (the three same-shape booking tables).
const ALL_BOOKING_TYPES = ["group", "walk", "event"];

/** Escape a single CSV cell. */
function csvCell(value) {
  if (value === null || value === undefined) return "";
  let str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\r\n]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Build a CSV string from rows (array of objects) and an ordered column list. */
function toCsv(rows, columns) {
  const header = columns.map(csvCell).join(",");
  const body = rows
    .map((row) => columns.map((col) => csvCell(row[col])).join(","))
    .join("\r\n");
  return `${header}\r\n${body}`;
}

/** Build Strapi filters for a single report type from the query params. */
function buildFilters(typeConfig, { tour, status, dateFrom, dateTo, dateField }) {
  const filters = {};
  const and = [];

  if (tour && typeConfig.tourFields.length) {
    and.push({
      $or: typeConfig.tourFields.map((f) => ({ [f]: { $containsi: tour } })),
    });
  }

  if (status && typeConfig.statusField) {
    filters[typeConfig.statusField] = { $eq: status };
  }

  const field = dateField || typeConfig.dateField;
  if (dateFrom || dateTo) {
    filters[field] = {};
    if (dateFrom) filters[field].$gte = dateFrom;
    if (dateTo) filters[field].$lte = `${dateTo}T23:59:59.999Z`;
  }

  if (and.length) filters.$and = and;
  return filters;
}

/** Fetch all matching rows for one type (paginates to avoid the default cap). */
async function fetchRows(strapi, typeKey, query) {
  const cfg = TYPES[typeKey];
  const filters = buildFilters(cfg, query);
  const sortField = cfg.dateField === "createdAt" ? "createdAt" : cfg.dateField;

  const pageSize = 1000;
  let start = 0;
  const out = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await strapi.documents(cfg.model).findMany({
      filters,
      sort: { [sortField]: "desc" },
      start,
      limit: pageSize,
    });
    out.push(...batch);
    if (batch.length < pageSize) break;
    start += pageSize;
  }
  return out;
}

/**
 * Build a CSV report.
 * @param {object} strapi - the global strapi instance
 * @param {object} query  - { type, tour, status, dateFrom, dateTo, dateField }
 * @returns {Promise<{ csv: string, filename: string, rowCount: number }>}
 */
async function buildReport(strapi, query) {
  const type = (query.type || "all").toLowerCase();
  const params = {
    tour: query.tour,
    status: query.status,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    dateField: query.dateField,
  };

  let columns;
  let rows = [];

  if (type === "all") {
    columns = ["bookingType", ...TYPES.group.columns];
    for (const key of ALL_BOOKING_TYPES) {
      const batch = await fetchRows(strapi, key, params);
      for (const r of batch) {
        rows.push({ bookingType: TYPES[key].label, ...r });
      }
    }
    rows.sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || "")),
    );
  } else {
    const cfg = TYPES[type];
    if (!cfg) {
      const err = new Error(
        `Unknown type "${type}". Use: ${Object.keys(TYPES).join(", ")}, all.`,
      );
      err.status = 400;
      throw err;
    }
    columns = cfg.columns;
    rows = await fetchRows(strapi, type, params);
  }

  const csv = toCsv(rows, columns);
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `report-${type}-${stamp}.csv`;

  return { csv, filename, rowCount: rows.length };
}

module.exports = { buildReport, TYPES };
