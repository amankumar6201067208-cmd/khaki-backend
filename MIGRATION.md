# SQLite → PostgreSQL Migration Guide

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
