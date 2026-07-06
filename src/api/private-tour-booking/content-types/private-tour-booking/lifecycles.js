const emailTemplate = require("../../../../utils/emailTemplate");
const { sendMail } = require("../../../../utils/mailer");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Private tour confirmation from hi@khakitours.com. Email failure must not
    // break booking creation.
    try {
      await sendMail("khakitours", {
        to: result.email,
        subject: "Booking Request Received",
        html: emailTemplate({
          ...result,
          tourName: result.tourName || "Private Tour",
        }),
      });
    } catch (emailErr) {
      strapi.log.error(`Private tour booking email failed: ${emailErr.message}`);
    }
  },
};
