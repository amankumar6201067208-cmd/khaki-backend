// Single source of truth for "which sites may talk to this API".
// Used by CORS (browser-side enforcement) and originGuard (server-side).
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : ["https://khakitours.com", "https://www.khakitours.com"];

module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:'],
          'media-src': ["'self'", 'data:', 'blob:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      enabled: true,
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  {
    name: 'global::originGuard',
    config: {
      origins: corsOrigins,
      // Set ORIGIN_GUARD=false to turn the server-side check off.
      enabled: process.env.ORIGIN_GUARD !== 'false',
    },
  },
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
