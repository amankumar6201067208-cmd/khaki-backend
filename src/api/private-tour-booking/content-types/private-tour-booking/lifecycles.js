const emailTemplate = require("../../../../utils/emailTemplate");

// Optional BCC copy of the request — only added when configured.
const BOOKING_ADMIN_EMAIL = process.env.BOOKING_ADMIN_EMAIL;

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Email failure must not break booking creation.
    try {
      await strapi.plugins["email"].services.email.send({
        to: result.email,
        ...(BOOKING_ADMIN_EMAIL ? { bcc: BOOKING_ADMIN_EMAIL } : {}),
        subject: "Booking Request Received ",
        html: emailTemplate({
          ...result,
          tourName: result.tourName || "Private Tour",
        }),
      });
    } catch (emailErr) {
      strapi.log.error(
        `Private tour booking email failed: ${emailErr.message}`,
      );
    }
  },
};
