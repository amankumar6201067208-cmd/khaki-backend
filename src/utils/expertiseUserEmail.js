module.exports = (data) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Thank you for your interest 🙌</h2>

      <p>Hi ${data.name},</p>

      <p>We have received your expertise submission. Our team will review it and get back to you.</p>

      <p><b>Expertise:</b> ${data.expertise}</p>

      <br/>
      <p>Regards,<br/>Khaki Tours Team</p>
    </div>
  `;
};

