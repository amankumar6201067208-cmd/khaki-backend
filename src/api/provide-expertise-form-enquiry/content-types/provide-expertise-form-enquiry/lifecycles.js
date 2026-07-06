const userEmail = require("../../../../utils/expertiseUserEmail");
const { sendMail } = require("../../../../utils/mailer");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    try {
      await sendMail("khakilab", {
        to: result.email,
        subject:
          "Your offer to volunteer your expertise for Khaki Heritage Foundation",
        html: userEmail(result),
      });
    } catch (err) {
      strapi.log.error(`Provide-expertise email failed: ${err.message}`);
    }
  },
};
