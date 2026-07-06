const { buildEmail, esc } = require("./emailBase");

const ZOOM_LINK =
  process.env.EVENT_ZOOM_LINK ||
  "https://us02web.zoom.us/j/7767127489?pwd=djlGQ0dvcXJGYkI4Tnd6dnBTcmRIdz09&omn=88025629472";
const ZOOM_MEETING_ID = process.env.EVENT_ZOOM_MEETING_ID || "776 712 7489";
const ZOOM_PASSCODE = process.env.EVENT_ZOOM_PASSCODE || "6b9bva";

module.exports = (data = {}) => {
  const eventName = data.tourTitle || data.tourSlug || "the event";
  const date = data.date || "";
  const time = data.slot || "";

  return buildEmail({
    greeting: `Dear ${data.contactName || ""}`.trim(),
    intro: [
      `Thank you for registering for <strong>${esc(eventName)}</strong> on ${esc(date)} at ${esc(time)}.`,
      "Your registration details are as follows:",
    ],
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
      `To attend the talk, login on ${esc(date)} at ${esc(time)} here:<br/>
       Link: <a href="${esc(ZOOM_LINK)}" style="color:#DB4D27;">${esc(ZOOM_LINK)}</a><br/>
       Meeting ID: ${esc(ZOOM_MEETING_ID)}<br/>
       Passcode: ${esc(ZOOM_PASSCODE)}`,
      "In case you get logged out, use the same link above to join again.",
      `We request that:<br/>
       - You keep your microphone on mute.<br/>
       - You switch off your video to avoid bandwidth issues.<br/>
       - You use earphones/headphones for better audio clarity.<br/>
       - You use the chat box to ask your questions for the Q&amp;A at the end of the talk.<br/>
       - You don’t use the chat box for conversations.`,
      "We look forward to your presence at the talk.",
    ],
  });
};
