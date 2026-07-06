const { buildEmail } = require("./emailBase");

// Donation confirmation (sent from khakilabevents@gmail.com).
module.exports = (data = {}) => {
  const firstName = (data.name || "").trim().split(/\s+/)[0] || "";
  return buildEmail({
    greeting: `Dear ${firstName}`.trim(),
    intro: ["Thank you for supporting our work with a donation."],
    formRows: [
      ["Name", data.name],
      ["Email", data.email],
      ["Phone", data.phone],
      ["Address", data.address],
      ["PAN", data.pan],
      ["Amount", data.amount ? `₹ ${data.amount}` : ""],
    ],
    outro: [
      "Your contribution will go a long way in helping us create awareness for, archive and conserve Mumbai’s heritage.",
      "We will be sending across the 80G certificate soon.",
    ],
  });
};
