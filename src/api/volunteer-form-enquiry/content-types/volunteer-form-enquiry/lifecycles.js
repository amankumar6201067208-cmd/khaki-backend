const userEmail = require("../../../../utils/volunteerUserEmail");
const adminEmail = require("../../../../utils/volunteerAdminEmail");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    try {
      // User email
      await strapi.plugins["email"].services.email.send({
        to: result.email,
        subject: "Volunteer Request Received ",
        html: userEmail(result),
      });

      // Admin email
      await strapi.plugins["email"].services.email.send({
        to: "amanpersonal94710@gmail.com",
        subject: "New Volunteer Request ",
        html: adminEmail(result),
      });

    } catch (err) {
      console.error("Email error:", err);
    }
  },
};