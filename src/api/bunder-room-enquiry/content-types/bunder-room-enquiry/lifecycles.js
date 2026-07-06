const userEmail = require("../../../../utils/bunderUserEmail");
const { sendMail } = require("../../../../utils/mailer");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Confirmation from khakilabevents@gmail.com. Email failure must not break
    // the form submission.
    try {
      await sendMail("khakilab", {
        to: result.email,
        subject: "Re: Your Bunder Room Booking Request",
        html: userEmail(result),
      });
    } catch (err) {
      strapi.log.error(`Bunder room email failed: ${err.message}`);
    }
  },
};
