const emailTemplate = (data) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      
      <p>Dear ${data.title} ${data.name},</p>

      <p>
        Thank you for getting in touch with us. We have received your request for 
        <b>#${data.tourName || "Tour"}</b> on <b>${data.preferredDate}</b> at 
        <b>${data.startTime}</b>. We are checking the availability of hosts for this tour. 
        We shall get back to you shortly.
      </p>

      <br/>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
        
        <tr>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>Tour:</b></td>
          <td style="border: 1px solid #ccc; padding: 10px;">
            #${data.tourName || "-"}
          </td>
        </tr>

        <tr>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>Name:</b></td>
          <td style="border: 1px solid #ccc; padding: 10px;">
            ${data.title} ${data.name}
          </td>
        </tr>

        <tr>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>Phone:</b></td>
          <td style="border: 1px solid #ccc; padding: 10px;">
            ${data.countryCode} ${data.phone}
          </td>
        </tr>

        <tr>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>Email:</b></td>
          <td style="border: 1px solid #ccc; padding: 10px;">
            <a href="mailto:${data.email}">${data.email}</a>
          </td>
        </tr>

        <tr>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>Country Of Origin:</b></td>
          <td style="border: 1px solid #ccc; padding: 10px;">
            ${data.country}
          </td>
        </tr>

        <tr>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>Preferred Date:</b></td>
          <td style="border: 1px solid #ccc; padding: 10px;">
            ${data.preferredDate}
          </td>
        </tr>

        <tr>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>Preferred Time:</b></td>
          <td style="border: 1px solid #ccc; padding: 10px;">
            ${data.startTime}
          </td>
        </tr>

        <tr>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>No of guests:</b></td>
          <td style="border: 1px solid #ccc; padding: 10px;">
            ${data.people}
          </td>
        </tr>

        <tr>
          <td style="border: 1px solid #ccc; padding: 10px;"><b>Any other Request:</b></td>
          <td style="border: 1px solid #ccc; padding: 10px;">
            ${data.otherRequest || "-"}
          </td>
        </tr>

      </table>

      <br/>

      <p>Regards,<br/>Your Travel Team</p>
    </div>
  `;
};

module.exports = emailTemplate;