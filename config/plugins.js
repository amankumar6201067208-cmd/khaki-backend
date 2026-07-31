module.exports = ({ env }) => ({

  // Images are stored on the local disk (public/uploads) — the Strapi default
  // local provider. Cloudinary has been removed. `sizeLimit` is generous for
  // large tour photos.
  upload: {
    config: {
      sizeLimit: 50 * 1024 * 1024, // 50 MB
    },
  },

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

  reports: {
    enabled: true,
    resolve: "./src/plugins/reports",
  },
});