const adminEmail = require("../../../../utils/contactAdminEmail");
const userEmail = require("../../../../utils/contactUserEmail");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    try {
      //  USER EMAIL
      await strapi.plugins["email"].services.email.send({
        to: result.email,
        subject: "We received your message ",
        html: userEmail(result),
      });

      //  ADMIN EMAIL
      await strapi.plugins["email"].services.email.send({
        to: "amanpersonal94710@gmail.com",
        subject: "New Contact Form Submission",
        html: adminEmail(result),
      });

      console.log("Contact emails sent ");
    } catch (err) {
      console.error("Email error:", err);
    }
  },
};

