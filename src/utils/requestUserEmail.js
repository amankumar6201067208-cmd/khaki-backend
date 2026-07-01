module.exports = (data) => {
  return `
    <div>
      <h2>Request Sent Successfully ✅</h2>
      <p>Hi ${data.yourName},</p>
      <p>Your message has been sent to your friend.</p>
    </div>
  `;
};