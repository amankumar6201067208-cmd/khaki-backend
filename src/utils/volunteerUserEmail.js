module.exports = (data) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Thank you for volunteering 🙌</h2>

      <p>Hi ${data.name},</p>

      <p>We have received your volunteer request. Our team will get back to you soon.</p>

      <br/>
      <p>Regards,<br/>Khaki Tours Team</p>
    </div>
  `;
};