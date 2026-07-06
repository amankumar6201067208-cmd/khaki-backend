"use strict";
const SKIP_PATHS = [
  "/api/payment/success",
  "/api/payment/failure",
  "/api/event-payment/success",
  "/api/event-payment/failure",
  "/api/donation-payment/success",
  "/api/donation-payment/failure",
];

module.exports = (config, { strapi }) => {
  const windowMs = config.windowMs || 60_000; // 1 minute
  const max = config.max || 30; // requests per IP per window

  /** @type {Map<string, { count: number, resetAt: number }>} */
  const hits = new Map();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of hits) {
      if (bucket.resetAt <= now) hits.delete(ip);
    }
  }, windowMs);
  if (sweep.unref) sweep.unref();

  return async (ctx, next) => {
    // Only throttle state-changing public requests.
    const isWrite = ["POST", "PUT", "PATCH"].includes(ctx.request.method);
    if (!isWrite || SKIP_PATHS.includes(ctx.request.path)) {
      return next();
    }

    const ip = ctx.request.ip || "unknown";
    const now = Date.now();
    const bucket = hits.get(ip);

    if (!bucket || bucket.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      ctx.set("Retry-After", String(retryAfter));
      strapi.log.warn(`Rate limit hit for ${ip} on ${ctx.request.path}`);
      return ctx.throw(429, "Too many requests. Please try again shortly.");
    }

    return next();
  };
};
