const { buildEmail } = require("./emailBase");

// Bunder Room booking-request confirmation (sent from khakilabevents@gmail.com).
module.exports = (data = {}) =>
  buildEmail({
    greeting: `Dear ${data.name || ""}`.trim(),
    intro: [
      "Thank you for your interest in booking the Bunder Room at Khaki Lab.",
      "Your booking request is as follows:",
    ],
    formRows: [
      ["Name", data.name],
      ["Email", data.email],
      ["Phone", data.phone],
      ["Organization", data.organization],
      ["Booking Date", data.bookingDate],
      ["Timing", data.timing],
      ["Layout", data.layout],
      ["Comments", data.comments],
    ],
    outro: [
      "Our team is looking at the Bunder Room’s availability for your chosen time and date, and will contact you soon.",
    ],
  });
