const eventOnlineEmail = require("./eventOnlineEmail");
const eventOfflineEmail = require("./eventOfflineEmail");
const { sendMail } = require("./mailer");

/**
 * @param {object} strapi  global strapi instance
 * @param {object} booking public-event-booking record (contact*, tourSlug,
 *       
 */
async function sendEventConfirmation(strapi, booking) {
  let eventType = null;
  try {
    const activities = await strapi
      .documents("api::public-walk-and-event.public-walk-and-event")
      .findMany({
        filters: { Slug: booking.tourSlug },
        fields: ["EventType"],
        status: "published",
      });
    eventType = activities?.[0]?.EventType || null;
  } catch (err) {
    // If the lookup fails, default to the offline (event) template.
    // @ts-ignore
    strapi.log.warn(`EventType lookup failed for ${booking.tourSlug}: ${err.message}`);
  }

  const isOnline = eventType === "Online";
  const html = isOnline ? eventOnlineEmail(booking) : eventOfflineEmail(booking);
  const eventName = booking.tourTitle || "the event";
  const subject = `Registration Confirmed for ${eventName}${isOnline ? " (Online)" : ""}`;

  await sendMail("khakilab", {
    to: booking.contactEmail,
    subject,
    html,
  });
}

module.exports = { sendEventConfirmation };
