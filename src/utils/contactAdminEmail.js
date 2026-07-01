module.exports = (data) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2> New Contact Form Submission</h2>

      <table style="width:100%; border-collapse: collapse;">
        <tr><td><b>Name:</b></td><td>${data.name}</td></tr>
        <tr><td><b>Email:</b></td><td>${data.email}</td></tr>
        <tr><td><b>Phone:</b></td><td>${data.phone}</td></tr>
        <tr><td><b>Subject:</b></td><td>${data.subject}</td></tr>
        <tr><td><b>Message:</b></td><td>${data.message}</td></tr>
      </table>
    </div>
  `;
};

