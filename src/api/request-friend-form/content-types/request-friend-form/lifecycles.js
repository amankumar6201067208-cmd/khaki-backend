const userEmail = require("../../../../utils/requestUserEmail");
const friendEmail = require("../../../../utils/requestFriendEmail");
const { sendMail } = require("../../../../utils/mailer");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    // Both go from khakilabevents@gmail.com. Each wrapped so one failure
    // doesn't stop the other or break the form submission.
    try {
      await sendMail("khakilab", {
        to: result.yourEmail,
        subject: "Thank You for Spreading the Word about Khaki Heritage Foundation",
        html: userEmail(result),
      });
    } catch (err) {
      strapi.log.error(`Request-a-friend (user) email failed: ${err.message}`);
    }

    try {
      await sendMail("khakilab", {
        to: result.friendEmail,
        subject: "A message from your friend 💌",
        html: friendEmail(result),
      });
    } catch (err) {
      strapi.log.error(`Request-a-friend (friend) email failed: ${err.message}`);
    }
  },
};
