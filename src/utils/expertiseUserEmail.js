const { buildEmail } = require("./emailBase");

// Provide-Expertise confirmation (sent from khakilabevents@gmail.com).
module.exports = (data = {}) =>
  buildEmail({
    greeting: `Dear ${data.name || ""}`.trim(),
    intro: ["Thank you for offering to volunteer with the Khaki Heritage Foundation."],
    formRows: [
      ["Name", data.name],
      ["Email", data.email],
      ["Phone", data.phone],
      ["Gender", data.gender],
      ["Age", data.age],
      ["Education", data.education],
      ["Profession", data.profession],
      ["Expertise", data.expertise],
      ["About", data.about],
    ],
    outro: [
      "Support from people with skills and experience helps us do better, think deeper, and create greater impact. We truly appreciate your willingness to contribute.",
      "We’ll connect with you soon.",
    ],
  });
