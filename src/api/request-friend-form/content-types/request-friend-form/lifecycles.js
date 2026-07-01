const userEmail = require("../../../../utils/requestUserEmail");
const friendEmail = require("../../../../utils/requestFriendEmail");
const adminEmail = require("../../../../utils/requestAdminEmail");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    try {
      // ✅ 1. USER EMAIL
      await strapi.plugins["email"].services.email.send({
        to: result.yourEmail,
        subject: "Your message has been sent ✅",
        html: userEmail(result),
      });

      // ✅ 2. FRIEND EMAIL (MAIN)
      await strapi.plugins["email"].services.email.send({
        to: result.friendEmail,
        subject: "A message from your friend 💌",
        html: friendEmail(result),
      });

      // ✅ 3. ADMIN EMAIL
      await strapi.plugins["email"].services.email.send({
        to: "amanpersonal94710@gmail.com",
        subject: "New Friend Request 🚀",
        html: adminEmail(result),
      });

    } catch (err) {
      console.error("Email error:", err);
    }
  },
};