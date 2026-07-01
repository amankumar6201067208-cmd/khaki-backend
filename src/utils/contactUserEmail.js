module.exports = (data) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Thank you for contacting us </h2>

      <p>Hi ${data.name},</p>

      <p>We have received your message and will get back to you shortly.</p>

      <h3>Your Message:</h3>
      <p>Subject: ${data.subject}</p>
      <p>Message: ${data.message}</p>

      <br/>
      <p>Regards,<br/>Khaki Tours Team</p>
    </div>
  `;
};

