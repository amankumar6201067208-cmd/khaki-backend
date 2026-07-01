module.exports = (data) => {
  return `
    <div>
      <p>Hi ${data.friendName},</p>

      <p>${data.message}</p>

      <br/>
      <p>Shared by: ${data.yourName}</p>
    </div>
  `;
};