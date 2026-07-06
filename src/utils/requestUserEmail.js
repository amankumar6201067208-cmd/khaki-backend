const { buildEmail } = require("./emailBase");

module.exports = (data = {}) =>
  buildEmail({
    greeting: `Dear ${data.yourName || ""}`.trim(),
    intro: [
      "Thank you for thinking of us and referring someone who may like to support our work. We will be in touch with them.",
    ],
    formRows: [
      ["Your Name", data.yourName],
      ["Your Email", data.yourEmail],
      ["Friend’s Name", data.friendName],
      ["Friend’s Email", data.friendEmail],
      ["Message", data.message],
    ],
    outro: [
      "Your support (and theirs) will help us take our mission of “Heritage Evangelism” forward.",
      "We truly appreciate it.",
    ],
  });
