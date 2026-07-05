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