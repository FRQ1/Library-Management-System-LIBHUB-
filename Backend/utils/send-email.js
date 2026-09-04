const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_HOST) {
    console.log("=== EMAIL (no SMTP configured, logging instead) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log("=====================================================");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "LibHub <no-reply@libhub.com>",
    to,
    subject,
    html,
    text,
  });
};

module.exports = sendEmail;
