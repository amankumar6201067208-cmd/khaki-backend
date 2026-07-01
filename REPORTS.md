# Custom Report Export

Two ways to export targeted booking/donation reports (filter by tour, tour date
range, status, or all booking types combined):

1. **Admin panel** — a "Reports" page in the sidebar (recommended, no token needed).
2. **URL / bookmark** — a token-protected API for scripts and quick links.

Both share the same logic (`src/utils/reportBuilder.js`).

---

## 1. Admin panel UI (recommended)

A local plugin (`src/plugins/reports`) adds a **Reports** item to the admin
sidebar (download icon). Open it, pick:

- **Report type** — Group / Walk / Event / Donation / Private / All combined
- **Tour** — optional slug or title (partial match)
- **Status** — Any / Paid / Pending / Failed
- **Date from / Date to** — filters the actual tour date

…then click **Download CSV**. No token needed — it uses your admin login.

After pulling this code the first time, start with `npm run develop` so the admin
panel rebuilds with the new page (or `npm run build` once for production).

---

## 2. URL / bookmark API

A flexible CSV export endpoint for building targeted booking/donation reports —
beyond the date-range-only option of the export-import-kkm plugin.

It filters by the **actual tour date** (not just when the booking was created),
by **specific tour**, by **status**, and can combine all booking types in one
file. The result is a CSV that opens directly in Excel / Google Sheets.

## Setup (one time)

Add a secret to `.env`:

```env
EXPORT_TOKEN=choose_a_long_random_secret
```

If `EXPORT_TOKEN` is not set, the endpoint refuses to run (fail-closed) because
the data contains personal info (emails, phones).

## URL

```
GET /api/reports/bookings?token=YOUR_SECRET&type=...&...filters
```

Just open the URL in your browser (while the secret is in the query) and the CSV
downloads. Bookmark common reports for one-click access.

## Parameters

| Param      | Values / format                                        | Notes |
|------------|--------------------------------------------------------|-------|
| `token`    | your `EXPORT_TOKEN`                                     | required |
| `type`     | `group`, `walk`, `event`, `donation`, `private`, `all` | default `all` (= the 3 booking types combined) |
| `tour`     | any text, e.g. `jaipur`                                | partial, case-insensitive; matches tour slug OR title |
| `status`   | `pending` / `paid` / `failed`                          | bookings use Bookingstatus; donations use paymentStatus |
| `dateFrom` | `YYYY-MM-DD`                                            | inclusive |
| `dateTo`   | `YYYY-MM-DD`                                            | inclusive (whole day) |
| `dateField`| `date` or `createdAt`                                  | optional override; default = tour date for bookings, createdAt for donations |

## Examples

```
# All bookings of one tour
/api/reports/bookings?token=SECRET&type=group&tour=fort-walk

# One tour within a tour-date range
/api/reports/bookings?token=SECRET&type=group&tour=jaipur&dateFrom=2026-01-01&dateTo=2026-03-31

# Only paid bookings, all tour types combined, for a quarter
/api/reports/bookings?token=SECRET&type=all&status=paid&dateFrom=2026-04-01&dateTo=2026-06-30

# All donations in a date range
/api/reports/bookings?token=SECRET&type=donation&dateFrom=2026-01-01&dateTo=2026-12-31

# Private tour requests
/api/reports/bookings?token=SECRET&type=private
```

## Notes

- Rows are sorted by date (most recent first).
- The endpoint is a `GET`, so it is exempt from the public-write rate limiter.
- Implemented in `src/api/report/` (controller + route) — fully owned by this
  codebase; the third-party export plugin is untouched and still available.
- Tip: the export-import-kkm plugin's Export button also honours Strapi's native
  **Filters** in the content manager — apply a filter there, then Export, to get
  a filtered XLSX. This custom endpoint adds tour-date filtering and combined
  multi-type reports, which the plugin can't do.
