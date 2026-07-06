const { buildEmail } = require("./emailBase");

// Volunteer confirmation (sent from khakilabevents@gmail.com).
module.exports = (data = {}) =>
  buildEmail({
    greeting: `Dear ${data.name || ""}`.trim(),
    intro: ["Thank you for your interest in volunteering with Khaki Heritage Foundation."],
    formRows: [
      ["Name", data.name],
      ["Email", data.email],
      ["Phone", data.phone],
      ["Gender", data.gender],
      ["Age", data.age],
      ["Education", data.education],
      ["Profession", data.profession],
      ["About", data.about],
    ],
    outro: ["We’ll be in touch soon to take this forward."],
  });
