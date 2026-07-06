const userEmail = require("../../../../utils/contactUserEmail");
const { sendMail } = require("../../../../utils/mailer");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Contact Us is a form → confirmation from khakilabevents@gmail.com.
    try {
      await sendMail("khakilab", {
        to: result.email,
        subject: "We received your message",
        html: userEmail(result),
      });
    } catch (err) {
      strapi.log.error(`Contact-us email failed: ${err.message}`);
    }
  },
};
