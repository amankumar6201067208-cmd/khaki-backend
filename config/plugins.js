module.exports = ({ env }) => ({
  // Media uploads. When Cloudinary credentials are set, files are stored on
  // Cloudinary (persistent across deploys). Without them, Strapi falls back to
  // the built-in local provider — so local dev keeps working with no setup.
  ...(env("CLOUDINARY_NAME")
    ? {
        upload: {
          config: {
            provider: "cloudinary",
            providerOptions: {
              cloud_name: env("CLOUDINARY_NAME"),
              api_key: env("CLOUDINARY_KEY"),
              api_secret: env("CLOUDINARY_SECRET"),
            },
            actionOptions: {
              upload: {},
              uploadStream: {},
              delete: {},
            },
          },
        },
      }
    : {}),

  // Strapi's built-in email plugin — used for ADMIN system emails (e.g. admin
  // password reset). Points at the khakilab account. Booking/form confirmation
  // emails do NOT use this; they go through src/utils/mailer.js (two accounts).
  email: {
    config: {
      provider: "@strapi/provider-email-nodemailer",
      providerOptions: {
        host: env("KHAKILAB_EMAIL_HOST", "smtp.gmail.com"),
        port: env.int("KHAKILAB_EMAIL_PORT", 587),
        auth: {
          user: env("KHAKILAB_EMAIL_USER"),
          pass: env("KHAKILAB_EMAIL_PASS"),
        },
      },
      settings: {
        defaultFrom: env("KHAKILAB_EMAIL_USER"),
        defaultReplyTo: env("KHAKILAB_EMAIL_USER"),
      },
    },
  },
  // Local plugin: adds a "Reports" page to the admin sidebar for filtered
  // CSV exports (src/plugins/reports).
  reports: {
    enabled: true,
    resolve: "./src/plugins/reports",
  },
});