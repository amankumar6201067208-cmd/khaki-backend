module.exports = (data) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>🚨 New Room Booking Request</h2>

      <table>
        <tr><td><b>Name:</b></td><td>${data.name}</td></tr>
        <tr><td><b>Email:</b></td><td>${data.email}</td></tr>
        <tr><td><b>Phone:</b></td><td>${data.phone}</td></tr>
        <tr><td><b>Organization:</b></td><td>${data.organization}</td></tr>
        <tr><td><b>Date:</b></td><td>${data.bookingDate}</td></tr>
        <tr><td><b>Timing:</b></td><td>${data.timing}</td></tr>
        <tr><td><b>Layout:</b></td><td>${data.layout}</td></tr>
        <tr><td><b>Comments:</b></td><td>${data.comments}</td></tr>
      </table>
    </div>
  `;
};