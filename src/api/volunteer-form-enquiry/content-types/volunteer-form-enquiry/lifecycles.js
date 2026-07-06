const userEmail = require("../../../../utils/volunteerUserEmail");
const { sendMail } = require("../../../../utils/mailer");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    try {
      await sendMail("khakilab", {
        to: result.email,
        subject:
          "Thank You for Your Interest in Volunteering with Khaki Heritage Foundation",
        html: userEmail(result),
      });
    } catch (err) {
      strapi.log.error(`Volunteer email failed: ${err.message}`);
    }
  },
};
