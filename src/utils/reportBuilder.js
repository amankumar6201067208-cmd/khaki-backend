"use strict";

const TYPES = {
  group: {
    model: "api::booking.booking",
    label: "Group Tour",
    dateField: "date",
    slotField: "slot",
    statusField: "Bookingstatus",
    tourFields: ["tourSlug", "tourTitle"],
    columns: [
      "bookingId",
      "tourTitle",
      "tourSlug",
      "date",
      "slot",
      "tickets",
      "totalAmount",
      "Bookingstatus",
      "contactName",
      "contactEmail",
      "contactPhone",
      "startingPoint",
      "passengers",
      "createdAt",
    ],
  },
  walk: {
    model: "api::public-walk-booking.public-walk-booking",
    label: "Public Walk",
    dateField: "date",
    slotField: "slot",
    statusField: "Bookingstatus",
    tourFields: ["tourSlug", "tourTitle"],
    columns: [
      "bookingId",
      "tourTitle",
      "tourSlug",
      "date",
      "slot",
      "tickets",
      "totalAmount",
      "Bookingstatus",
      "contactName",
      "contactEmail",
      "contactPhone",
      "startingPoint",
      "passengers",
      "createdAt",
    ],
  },
  event: {
    model: "api::public-event-booking.public-event-booking",
    label: "Public Event",
    dateField: "date",
    slotField: "slot",
    statusField: "Bookingstatus",
    tourFields: ["tourSlug", "tourTitle"],
    columns: [
      "bookingId",
      "tourTitle",
      "tourSlug",
      "date",
      "slot",
      "tickets",
      "totalAmount",
      "Bookingstatus",
      "contactName",
      "contactEmail",
      "contactPhone",
      "startingPoint",
      "passengers",
      "createdAt",
    ],
  },
  donation: {
    model: "api::donation-booking.donation-booking",
    label: "Donation",
    dateField: "createdAt",
    statusField: "paymentStatus",
    tourFields: [],
    columns: [
      "donationId",
      "name",
      "email",
      "phone",
      "address",
      "pan",
      "amount",
      "paymentStatus",
      "comments",
      "createdAt",
    ],
  },
  private: {
    model: "api::private-tour-booking.private-tour-booking",
    label: "Private Tour",
    dateField: "preferredDate",
    slotField: "startTime",
    statusField: null,
    tourFields: ["tourName", "title", "tourslug"],
    columns: [
      "title",
      "tourName",
      "tourslug",
      "name",
      "email",
      "phone",
      "countryCode",
      "country",
      "preferredDate",
      "startTime",
      "endTime",
      "people",
      "totalAmount",
      "otherRequest",
      "acceptedTerms",
      "createdAt",
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
function buildFilters(
  typeConfig,
  { tour, status, slot, dateFrom, dateTo, dateField },
) {
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

  // Time-slot filter — uses each type's slot-like field (slot / startTime).
  if (slot && typeConfig.slotField) {
    filters[typeConfig.slotField] = { $eq: slot };
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

/**
 * Distinct, non-empty `slot` values across the booking types that have slots,
 * honouring the same tour/date filters. Powers the "Time slot" dropdown so the
 * admin can pick from the slots that actually exist for a date.
 * @param {object} strapi
 * @param {object} query - { type, tour, dateFrom, dateTo, dateField }
 * @returns {Promise<string[]>}
 */
async function distinctSlots(strapi, query) {
  const type = (query.type || "all").toLowerCase();
  const keys = type === "all" ? ALL_BOOKING_TYPES : [type];
  const slots = new Set();

  for (const key of keys) {
    const cfg = TYPES[key];
    if (!cfg || !cfg.slotField) continue;
    const slotField = cfg.slotField;

    // Build filters WITHOUT slot — we want every slot for this date/tour.
    const filters = buildFilters(cfg, {
      tour: query.tour,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      dateField: query.dateField,
    });

    const pageSize = 1000;
    let start = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await strapi.documents(cfg.model).findMany({
        filters,
        fields: [slotField],
        start,
        limit: pageSize,
      });
      for (const r of batch) {
        if (r[slotField] != null && String(r[slotField]).trim() !== "") {
          slots.add(String(r[slotField]));
        }
      }
      if (batch.length < pageSize) break;
      start += pageSize;
    }
  }

  return [...slots].sort();
}

/**
 * Distinct tour dates (YYYY-MM-DD, newest first) for a tour, across the booking
 * types that have a `date`. Powers the "Tour date" dropdown so the admin picks
 * from dates that actually have bookings.
 * @param {object} strapi
 * @param {object} query - { type, tour }
 * @returns {Promise<string[]>}
 */
async function distinctDates(strapi, query) {
  const type = (query.type || "all").toLowerCase();
  const keys = type === "all" ? ALL_BOOKING_TYPES : [type];
  const dates = new Set();

  for (const key of keys) {
    const cfg = TYPES[key];
    // Use the type's own date field (date / preferredDate). Skip donation,
    // whose date field is createdAt (not a tour date to pick from).
    if (!cfg || !cfg.dateField || cfg.dateField === "createdAt") continue;
    const dateField = cfg.dateField;

    const filters = buildFilters(cfg, { tour: query.tour });

    const pageSize = 1000;
    let start = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await strapi.documents(cfg.model).findMany({
        filters,
        fields: [dateField],
        start,
        limit: pageSize,
      });
      for (const r of batch) {
        if (r[dateField] != null && String(r[dateField]).trim() !== "") {
          dates.add(String(r[dateField]).slice(0, 10));
        }
      }
      if (batch.length < pageSize) break;
      start += pageSize;
    }
  }

  // YYYY-MM-DD sorts chronologically; reverse → newest first.
  return [...dates].sort().reverse();
}

/**
 * Count bookings by status for the current tour/date/slot filters, so the
 * "Status" dropdown can show which statuses exist and how many of each.
 * @param {object} strapi
 * @param {object} query - { type, tour, slot, dateFrom, dateTo, dateField }
 * @returns {Promise<Array<{ status: string, count: number }>>}
 */
async function statusCounts(strapi, query) {
  const type = (query.type || "all").toLowerCase();
  const keys = type === "all" ? ALL_BOOKING_TYPES : [type];
  const counts = {};

  for (const key of keys) {
    const cfg = TYPES[key];
    if (!cfg || !cfg.statusField) continue;

    // Filter by everything EXCEPT status (we're counting each status).
    const filters = buildFilters(cfg, {
      tour: query.tour,
      slot: query.slot,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      dateField: query.dateField,
    });

    const pageSize = 1000;
    let start = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await strapi.documents(cfg.model).findMany({
        filters,
        fields: [cfg.statusField],
        start,
        limit: pageSize,
      });
      for (const r of batch) {
        const s = r[cfg.statusField];
        if (s != null && String(s).trim() !== "") {
          counts[s] = (counts[s] || 0) + 1;
        }
      }
      if (batch.length < pageSize) break;
      start += pageSize;
    }
  }

  return Object.entries(counts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => a.status.localeCompare(b.status));
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
    slot: query.slot,
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
      // @ts-ignore
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

module.exports = {
  buildReport,
  distinctSlots,
  distinctDates,
  statusCounts,
  TYPES,
};
