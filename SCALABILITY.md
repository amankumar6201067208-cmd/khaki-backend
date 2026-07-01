# Khaki Tours — Scalability & Standardization Notes

This document records the scalability work done on the backend and the
recommended next steps. Frontend lives in `../Khaki-Tours-main`.

## What was changed (safe, non-breaking)

### Critical correctness (money / booking path)

1. **Seat oversell race condition — fixed.**
   Seat/ticket reduction does a read-modify-write on the trip's slot data.
   Under concurrent payment confirmations for the same slot, both reads saw the
   old count and both wrote the same reduced value → overselling. All three
   reduction paths (group / public event / public walk) are now serialized per
   trip with an in-process async lock (`src/utils/asyncLock.js`).

2. **Payment idempotency — added.**
   PayU can fire the success webhook more than once. Each booking type now
   returns early if it is already `paid`, so seats aren't reduced twice and the
   confirmation email isn't resent.

3. **Donation payment security — fixed.**
   `donation-payment.success` now verifies the PayU SHA-512 hash (previously
   missing — anyone could POST to mark a donation paid). Also fixed a bug where
   `failure` wrote to a non-existent `status` field instead of `paymentStatus`.

### Infrastructure

4. **PostgreSQL ready.** `pg` driver added; config is env-driven and still
   defaults to SQLite for local dev. See `MIGRATION.md` for the switch. **This
   is the single most important production change** — SQLite is single-writer
   and throws `SQLITE_BUSY` under concurrent bookings.

5. **CORS hardened.** Origins now come from `CORS_ORIGINS` (comma-separated),
   falling back to `*` only when unset (dev).

6. **Rate limiting added.** `src/middlewares/rateLimit.js` throttles public
   write endpoints per IP (default 30/min, configurable via `RATE_LIMIT_MAX` /
   `RATE_LIMIT_WINDOW_MS`). PayU server-to-server callbacks are explicitly
   exempt so payments are never dropped.

### Standardization

7. **No hardcoded URLs.** Frontend uses `VITE_API_URL` (via `src/api/strapi.js`);
   all forms route through it. Backend admin BCC uses `BOOKING_ADMIN_EMAIL`.
8. **`.env.example` documented** on both backend and frontend; `.env` gitignored.

## Recommended next steps (isolated, do when convenient)

- **DRY the payment controller.** `src/api/payment/controllers/payment.js` is
  large and the public-event/public-walk seat reduction overlaps. Extract the
  reduction algorithms into `src/api/payment/services/` and have the controller
  call them. Behavior should stay identical — add a test booking run before/after.
- **Structured logging.** Replace `console.log/error` with `strapi.log.*` so logs
  are levelled and can be shipped to a log aggregator in production.
- **Store seat counts as integers**, not strings, to avoid `Number()` coercion
  throughout. Requires a content-type change + data migration.
- **If scaling to multiple backend instances:** replace the in-process async
  lock and in-memory rate limiter with Postgres advisory locks / Redis, since
  in-memory state is per-process.

## Production deployment checklist

- [ ] `DATABASE_CLIENT=postgres` + filled DB credentials (see `MIGRATION.md`)
- [ ] Strong unique `APP_KEYS`, `*_SECRET`, `*_SALT`, `ENCRYPTION_KEY`
- [ ] `BACKEND_URL` / `FRONTEND_URL` set to real https URLs
- [ ] `CORS_ORIGINS` set to the production frontend origin(s)
- [ ] `PAYU_BASE_URL` pointed at PayU **production** (not test)
- [ ] `BOOKING_ADMIN_EMAIL` set
- [ ] Frontend built with `VITE_API_URL` = production backend URL
- [ ] One end-to-end test booking confirms seats decrement exactly once
