# SQLite → PostgreSQL Migration Guide

> ✅ **Local migration already done** (dev DB → local Postgres `khaki_tours`).
> This guide + the notes below are what to repeat for staging/production.

## Exact commands used (same-machine, data only)

```bash
# 1. Create the DB (psql or any client):  CREATE DATABASE khaki_tours;
# 2. Export from SQLite (assets already live in public/uploads, so exclude them):
DATABASE_CLIENT=sqlite npm run strapi -- export --no-encrypt --exclude files --file backup-db
# 3. Point .env at Postgres (DATABASE_CLIENT=postgres + host/port/name/user/password)
# 4. Import into the fresh Postgres DB:
npm run strapi -- import --file backup-db.tar.gz --exclude files --force
```

## ⚠️ Gotchas we hit (already fixed in the schema)

SQLite is loosely typed and silently accepted values Postgres rejects. Two
column types had to change (done in the content-type schemas):

1. **`blog.excerpt`: `string` → `text`** — an excerpt was 310 chars, but
   `string` maps to Postgres `varchar(255)` → `value too long`.
2. **All money fields (`totalAmount`, donation `amount`): `biginteger` →
   `decimal`** — discounts produce fractional amounts (e.g. `449.25`), which
   Postgres `bigint` rejects with `invalid input syntax for type bigint`. This
   also would have broken booking creation at RUNTIME on Postgres, not just import.

If you add new `string`/`integer` fields later, keep this in mind: long free
text → `text`, anything that can be fractional → `decimal`.

## ⚠️ Admin accounts are NOT transferred

Strapi export/import excludes `admin::user` for security. After switching to
Postgres you must **re-register the admin** at `http://localhost:1337/admin`
(first-run screen). Content, bookings, media, and permissions all transfer.

---

The app ships with SQLite as the default (zero-config, good for local dev).
For production with concurrent bookings, **switch to PostgreSQL**. SQLite allows
only one writer at a time, so under concurrent payment confirmations it throws
`SQLITE_BUSY: database is locked`. Postgres handles concurrent writes and scales.

> Nothing breaks by leaving `DATABASE_CLIENT=sqlite` — this migration is opt-in
> and driven entirely by environment variables. The `pg` driver is already in
> `package.json`.

## 1. Provision PostgreSQL

```bash
# Example with Docker
docker run --name khaki-pg -e POSTGRES_USER=khaki \
  -e POSTGRES_PASSWORD=change_me -e POSTGRES_DB=khaki_tours \
  -p 5432:5432 -d postgres:16
```

Or use a managed instance (RDS, Render, Railway, Supabase, etc.).

## 2. Point the backend at Postgres

In your production `.env`:

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=khaki_tours
DATABASE_USERNAME=khaki
DATABASE_PASSWORD=change_me
DATABASE_SSL=false          # set true + provide certs for managed DBs
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10        # raise for higher concurrency
```

## 3. Create the schema

Start Strapi once against the empty Postgres DB so it creates all tables:

```bash
npm run build
npm run start    # let it boot fully, then stop with Ctrl+C
```

## 4. Move existing data (Strapi Data Transfer)

Strapi's built-in transfer copies content + media between two running
instances. Run the **old SQLite** instance and the **new Postgres** instance,
then transfer from one to the other:

```bash
# Terminal A — source (SQLite). Generate a transfer token in the admin panel:
#   Settings → Transfer Tokens → Create  (copy the token)
DATABASE_CLIENT=sqlite npm run start

# Terminal B — destination (Postgres) pull from the source:
npm run strapi transfer -- --from http://OLD_HOST:1337/admin --from-token <TOKEN>
```

Alternatively use a simple export/import:

```bash
# from the SQLite instance
npm run strapi export -- --no-encrypt --file backup
# after switching .env to postgres
npm run strapi import -- --file backup.tar.gz
```

## 5. Verify

- Admin panel → all content types show the expected records.
- Place one test booking end-to-end (create → PayU → success) and confirm the
  seat count drops exactly once.

## Rollback

Revert `DATABASE_CLIENT` back to `sqlite` in `.env`. The original
`.tmp/data.db` is untouched by this process, so rollback is instant.
