module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "@strapi/provider-email-nodemailer",
      providerOptions: {
        host: "smtp.gmail.com",
        port: 587,
        auth: {
          user: env("EMAIL_USERNAME"),
          pass: env("EMAIL_PASSWORD"),
        },
      },
      settings: {
        defaultFrom: env("EMAIL_USERNAME"),
        defaultReplyTo: env("EMAIL_USERNAME"),
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