module.exports = (data) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Donation Successful ❤️</h2>

      <p>Hi ${data.name},</p>

      <p>Thank you for your generous contribution.</p>

      <p><b>Donation ID:</b> ${data.donationId}</p>
      <p><b>Amount:</b> ₹ ${data.amount}</p>

      <br/>
      <p>Your support helps us preserve heritage and make a difference.</p>

      <br/>
      <p>Regards,<br/>Khaki Foundation Team</p>
    </div>
  `;
};