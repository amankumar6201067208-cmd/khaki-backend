module.exports = (data) => {
  return `
    <div>
      <h2>🚀 New Friend Request</h2>

      <table>
        <tr><td><b>User:</b></td><td>${data.yourName}</td></tr>
        <tr><td><b>User Email:</b></td><td>${data.yourEmail}</td></tr>
        <tr><td><b>Friend:</b></td><td>${data.friendName}</td></tr>
        <tr><td><b>Friend Email:</b></td><td>${data.friendEmail}</td></tr>
      </table>
    </div>
  `;
};