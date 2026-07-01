const userEmail = require("../../../../utils/bunderUserEmail");
const adminEmail = require("../../../../utils/bunderAdminEmail");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    try {
      // User email
      await strapi.plugins["email"].services.email.send({
        to: result.email,
        subject: "Room Booking Request Received ✅",
        html: userEmail(result),
      });

      // Admin email
      await strapi.plugins["email"].services.email.send({
        to: "amanpersonal94710@gmail.com",
        subject: "New Room Booking 🚀",
        html: adminEmail(result),
      });

    } catch (err) {
      console.error("Email error:", err);
    }
  },
};