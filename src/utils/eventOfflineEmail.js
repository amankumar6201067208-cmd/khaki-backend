const { buildEmail, esc } = require("./emailBase");

// Default venue for offline events (Khaki Lab, Fort, Mumbai). Used when the
// booking record doesn't carry its own venue / location pin.
const KHAKI_LAB_VENUE =
  "Khaki Lab, 302, 3rd Floor, Hari Chambers, Shahid Bhagat Singh Road, Lion Gate, Fort, Above Copper Chimney restaurant, Mumbai, Maharashtra 400001";
const KHAKI_LAB_LOCATION_PIN = "https://maps.app.goo.gl/NMJFzMbzRU14RyBm9?g_st=iw";

// OFFLINE public event = an EVENT. Registration confirmation with venue details.
module.exports = (data = {}) => {
  const eventName = data.tourTitle || data.tourSlug || "the event";
  const date = data.date || "";
  const time = data.slot || "";
  const venue = KHAKI_LAB_VENUE;
  const locationPin = KHAKI_LAB_LOCATION_PIN;

  const intro = [
    `Thank you for registering for <strong>${esc(eventName)}</strong> on ${esc(date)} at ${esc(time)}.`,
    "Your registration details are as follows:",
  ];

  // Venue + location pin sit just above the outro (after the details table).
  const venueLines = [];
  if (venue) venueLines.push(`<strong>Venue:</strong> ${esc(venue)}`);
  if (locationPin) {
    venueLines.push(
      `<strong>Location pin:</strong> <a href="${esc(locationPin)}">View on Google Maps</a>`,
    );
  }

  return buildEmail({
    greeting: `Dear ${data.contactName || ""}`.trim(),
    intro,
    formRows: [
      ["Name", data.contactName],
      ["Email", data.contactEmail],
      ["Phone", data.contactPhone],
      ["Event", eventName],
      ["Date", date],
      ["Time", time],
      ["Tickets", data.tickets],
    ],
    outro: [
      ...venueLines,
      "Please arrive at the venue 15 mins before the scheduled time, so that we can start on time. Seating will be on a first-come-first-served basis.",
    ],
  });
};
