const { buildEmail, esc } = require("./emailBase");

// OFFLINE public event = an EVENT. Registration confirmation with venue details.
module.exports = (data = {}) => {
  const eventName = data.tourTitle || data.tourSlug || "the event";
  const date = data.date || "";
  const time = data.slot || "";
  const venue = data.startingPoint || "";
  const locationPin = data.locationPin || "";

  const intro = [
    `Thank you for registering for <strong>${esc(eventName)}</strong> on ${esc(date)} at ${esc(time)}.`,
  ];
  if (venue) intro.push(`Venue: ${esc(venue)}`);
  if (locationPin) intro.push(`Location pin: ${esc(locationPin)}`);
  intro.push("Your registration details are as follows:");

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
      ["Venue", venue],
    ],
    outro: [
      "Please arrive at the venue 15 mins before the scheduled time, so that we can start on time. Seating will be on a first-come-first-served basis.",
    ],
  });
};
