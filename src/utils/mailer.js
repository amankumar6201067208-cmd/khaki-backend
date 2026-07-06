"use strict";

const nodemailer = require("nodemailer");

const accounts = {
  khakitours: {
    host: process.env.KHAKITOURS_EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.KHAKITOURS_EMAIL_PORT) || 587,
    user: process.env.KHAKITOURS_EMAIL_USER,
    pass: process.env.KHAKITOURS_EMAIL_PASS,
    bcc: process.env.KHAKITOURS_BCC,
  },
  khakilab: {
    host: process.env.KHAKILAB_EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.KHAKILAB_EMAIL_PORT) || 587,
    user: process.env.KHAKILAB_EMAIL_USER,
    pass: process.env.KHAKILAB_EMAIL_PASS,
    bcc: process.env.KHAKILAB_BCC,
  },
};

const transporters = {};
const getTransporter = (account) => {
  if (!transporters[account]) {
    const a = accounts[account];
    transporters[account] = nodemailer.createTransport({
      host: a.host,
      port: a.port,
      secure: a.port === 465,
      auth: { user: a.user, pass: a.pass },
    });
  }
  return transporters[account];
};

/**
 * @param {"khakitours"|"khakilab"} account
 * @param {{ to: string, subject: string, html: string }} message
 */
async function sendMail(account, { to, subject, html }) {
  const a = accounts[account];
  if (!a) throw new Error(`Unknown email account "${account}"`);
  if (!a.user || !a.pass) {
    throw new Error(
      `Email account "${account}" is not configured — set its USER/PASS env vars.`,
    );
  }

  const bcc = a.bcc || undefined;

  return getTransporter(account).sendMail({
    from: `"Team Khaki" <${a.user}>`,
    to,
    ...(bcc ? { bcc } : {}),
    subject,
    html,
  });
}

module.exports = { sendMail };
