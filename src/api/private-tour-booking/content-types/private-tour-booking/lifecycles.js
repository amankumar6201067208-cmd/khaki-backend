const emailTemplate = require("../../../../utils/emailTemplate");
const { sendMail } = require("../../../../utils/mailer");

module.exports = {
  async afterCreate(event) {
    const { result } = event;

    const tourName = result.tourName || "Private Tour";

    const raw = String(result.preferredDate || "").slice(0, 10); // YYYY-MM-DD
    const [yy, mm, dd] = raw.split("-");
    const datePart = yy && mm && dd ? `${Number(mm)}/${Number(dd)}/${yy}` : raw;

    // Convert a "HH:MM" (24h) start time to "h:mm AM/PM"; leave other formats as-is.
    const to12h = (t) => {
      if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return t || "";
      const [h, m] = t.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
    };

    const receivedOn = `${datePart} ${to12h(result.startTime)}`.trim();

    try {
      await sendMail("khakitours", {
        to: result.email,
        subject: `Request received for booking - #${tourName}, On:${receivedOn}`,
        html: emailTemplate({
          ...result,
          tourName,
        }),
      });
    } catch (emailErr) {
      // @ts-ignore
      strapi.log.error(`Private tour booking email failed: ${emailErr.message}`);
    }
  },
};
