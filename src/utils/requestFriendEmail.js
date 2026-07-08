module.exports = (data) => {
  return `
    <div>
      <p>Hi ${data.friendName},</p>

      <p>${data.message}</p>

      <br/>
      <p>Shared by: ${data.yourName}</p>
      <br/>
      <p>Warm regards,<br/>Team Khaki</p>
    </div>
  `;
};