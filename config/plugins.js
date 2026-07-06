module.exports = ({ env }) => ({

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
            breakpoints: {},
          },
        },
      }
    : {}),

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