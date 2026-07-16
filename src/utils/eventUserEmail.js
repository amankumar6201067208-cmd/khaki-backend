module.exports = (data) => {
  return `
    <div style="font-family: Arial; padding: 20px; color:#333;">
      
      <p>Dear ${data.contactName},</p>

      <p>
        Your payment for booking <b>${data.tourTitle}</b> tour/walk on 
        <b>${data.date}</b> at <b>${data.slot}</b> has been received.
      </p>

      <p><b>Starting Point:</b> ${data.startingPoint}</p>

      <p><b>Amount:</b> ₹ ${data.totalAmount}</p>

      <p><b>Booking ID:</b> ${data.bookingId}</p>

      <br/>

      <p>
        Host details will be shared via email 24 hours prior to the scheduled walk.
        For bookings made less than 24 hours in advance, please contact us on 
        +91 88281 00111 to receive the host details.
      </p>

      <p>You may like to read a few media reports about the venture:</p>

      <p>
        <a href="http://www.natgeotraveller.in/urban-safari-exploring-mumbais-histories-and-mysteries-in-a-jeep/">NatGeo Traveller</a> |
        <a href="http://www.thehindu.com/news/cities/mumbai/talking-the-walk-unveiling-a-hidden-city-far-and-wide/article17349583.ece">The Hindu</a> |
        <a href="http://indianexpress.com/article/cities/mumbai/a-safari-trip-khaki-tours-mumbai-tourism-history-past-4434450/">The Indian Express</a> |
        <a href="http://www.hindustantimes.com/art-and-culture/insider-s-guide-to-bhuleshwar/story-oCddzwBJHvmhHURYv2AstO.html">Hindustan Times</a> |
        <a href="http://www.dnaindia.com/mumbai/comment-mumbai-s-hidden-secrets-2242952">DNA</a> |
        <a href="http://www.mid-day.com/articles/fort-icons/17562184">Mid-day</a> |
        <a href="http://www.asianage.com/mumbai/relearning-mumbai-s-yesterdays-547">The Asian Age</a> |
        <a href="http://www.livemint.com/Industry/uvxnRSvU2LZ8FDYTLlBC8N/Kala-GhodaFort-and-the-making-of-a-highstreet-retail-hub.html">The Mint</a>
      </p>

      <br/>

      <p>Thanks and Regards,<br/>
      Khaki Tours Pvt Ltd.<br/>
      +91-8828100111</p>

    </div>
  `;
};