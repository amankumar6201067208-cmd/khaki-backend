module.exports = (data) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Booking Request Received ✅</h2>

      <p>Hi ${data.name},</p>

      <p>We have received your booking request. Our team will get back to you shortly.</p>

      <p><b>Date:</b> ${data.bookingDate}</p>
      <p><b>Timing:</b> ${data.timing}</p>
      <p><b>Layout:</b> ${data.layout}</p>

      <br/>
      <p>Regards,<br/>Khaki Tours Team</p>
    </div>
  `;
};