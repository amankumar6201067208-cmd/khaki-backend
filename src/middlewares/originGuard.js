"use strict";

const SKIP_PATHS = [
  "/api/payment/success",
  "/api/payment/failure",
  "/api/event-payment/success",
  "/api/event-payment/failure",
  "/api/donation-payment/success",
  "/api/donation-payment/failure",
  "/api/reports/bookings", // guarded by EXPORT_TOKEN
];

/** "https://a.com/x?y" -> "https://a.com" ; returns null if unparseable. */
const toOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

module.exports = (config, { strapi }) => {
  const allowed = new Set(
    (config.origins || []).map((o) => toOrigin(o) || o).filter(Boolean)
  );

  if (config.enabled === false || allowed.size === 0) {
    if (config.enabled !== false) {
      strapi.log.warn(
        "originGuard: no allowed origins configured — guard is disabled."
      );
    }
    return async (ctx, next) => next();
  }

  strapi.log.info(`originGuard: active for [${[...allowed].join(", ")}]`);

  return async (ctx, next) => {
    const { method, path } = ctx.request;

    if (method === "OPTIONS" || method === "HEAD") return next();
    if (!path.startsWith("/api/")) return next();
    if (SKIP_PATHS.includes(path)) return next();
    // API tokens / user JWTs are real credentials — let Strapi's own auth judge.
    if (ctx.request.header.authorization) return next();

    const origin =
      toOrigin(ctx.request.header.origin) ||
      toOrigin(ctx.request.header.referer);

    if (origin && allowed.has(origin)) return next();

    strapi.log.warn(
      `originGuard: blocked ${method} ${path} from origin=${origin || "none"} ip=${ctx.request.ip}`
    );
    return ctx.throw(403, "Forbidden");
  };
};
