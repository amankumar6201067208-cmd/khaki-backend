module.exports = (data) => {
  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2> New Volunteer Request</h2>

      <table>
        <tr><td><b>Name:</b></td><td>${data.name}</td></tr>
        <tr><td><b>Email:</b></td><td>${data.email}</td></tr>
        <tr><td><b>Phone:</b></td><td>${data.phone}</td></tr>
        <tr><td><b>Gender:</b></td><td>${data.gender}</td></tr>
        <tr><td><b>Age:</b></td><td>${data.age}</td></tr>
        <tr><td><b>Education:</b></td><td>${data.education}</td></tr>
        <tr><td><b>Profession:</b></td><td>${data.profession}</td></tr>
        <tr><td><b>About:</b></td><td>${data.about}</td></tr>
      </table>
    </div>
  `;
};