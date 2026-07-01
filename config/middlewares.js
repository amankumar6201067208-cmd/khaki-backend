// CORS origins come from the CORS_ORIGINS env var (comma-separated).
// If unset (e.g. local dev), fall back to "*" so nothing breaks.
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["*"];

module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  {
    name: 'global::rateLimit',
    config: {
      // Requests per IP per window for public write endpoints.
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
      max: Number(process.env.RATE_LIMIT_MAX) || 30,
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
