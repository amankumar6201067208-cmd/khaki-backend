const userEmail = require("../../../utils/donationUserEmail");
const { sendMail } = require("../../../utils/mailer");

("use strict");
const crypto = require("crypto");

module.exports = {
  async create(ctx) {
    try {
      const { amount, name, email, phone, donationId } = ctx.request.body;

      // DIFFERENT PAYU ACCOUNT
      const key = process.env.DONATION_PAYU_KEY;
      const salt = process.env.DONATION_PAYU_SALT;
      const payuBaseUrl = process.env.PAYU_BASE_URL;
      const backendUrl = process.env.BACKEND_URL;

      const txnid = "don_" + Date.now();

      const hashString = `${key}|${txnid}|${amount}|Donation|${name}|${email}|${donationId}||||||||||${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      ctx.send({
        key,
        txnid,
        amount,
        productinfo: "Donation",
        firstname: name,
        email,
        phone,
        udf1: donationId,
        hash,
        payuBaseUrl,
        surl: `${backendUrl}/api/donation-payment/success`,
        furl: `${backendUrl}/api/donation-payment/failure`,
      });
    } catch (err) {
      ctx.throw(500, "Payment creation failed");
    }
  },

  async success(ctx) {
    try {
      const {
        status,
        firstname,
        amount,
        txnid,
        hash,
        key,
        productinfo,
        email,
        udf1,
      } = ctx.request.body;

      const donationId = udf1;
      const salt = process.env.DONATION_PAYU_SALT;
      const frontendUrl = process.env.FRONTEND_URL;
      const reverseString = `${salt}|${status}||||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const calculatedHash = crypto
        .createHash("sha512")
        .update(reverseString)
        .digest("hex");

      if (calculatedHash !== hash) {
        return ctx.redirect(`${frontendUrl}/failed?error=hash_mismatch`);
      }

      //  Fetch donation data
      const donation = await strapi.db
        .query("api::donation-booking.donation-booking")
        .findOne({
          where: { donationId },
        });

      if (!donation) {
        return ctx.redirect(
          `${frontendUrl}/thank-you?donationId=${donationId}&status=paid`,
        );
      }

      const { count } = await strapi.db
        .query("api::donation-booking.donation-booking")
        .updateMany({
          where: { donationId, paymentStatus: { $ne: "paid" } },
          data: { paymentStatus: "paid" },
        });

      if (count === 0) {
        return ctx.redirect(
          `${frontendUrl}/thank-you?donationId=${donationId}&status=paid`,
        );
      }

      //  USER EMAIL from khakilabevents@gmail.com (non-blocking).
      try {
        await sendMail("khakilab", {
          to: donation.email,
          subject: "Thank You for Your Donation to Khaki Heritage Foundation",
          html: userEmail(donation),
        });
      } catch (emailErr) {
        // @ts-ignore
        console.error(" Donation email failed:", emailErr.message);
      }

      return ctx.redirect(
        `${frontendUrl}/thank-you?donationId=${donationId}&status=paid`,
      );
    } catch (err) {
      console.error("Donation Success Error:", err);
      ctx.throw(500, "Donation success failed");
    }
  },

  async failure(ctx) {
    const { udf1 } = ctx.request.body;
    const donationId = udf1;
    const frontendUrl = process.env.FRONTEND_URL;

    await strapi.db.query("api::donation-booking.donation-booking").update({
      where: { donationId },
      data: { paymentStatus: "failed" },
    });

    return ctx.redirect(
      `${frontendUrl}/thank-you?donationId=${donationId}&status=failed`,
    );
  },
};
