const nodemailer = require("nodemailer");
const EmailConfig = require("../models/EmailConfig");

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const config = await EmailConfig.findOne();

    if (!config) {
      throw new Error("Email config not set");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.email,
        pass: config.password
      }
    });

    await transporter.sendMail({
      from: config.email,
      to,
      subject,
      html: htmlContent
    });

    console.log("✅ Email sent");

  } catch (err) {
    console.log("❌ Email error:", err.message);
  }
};

module.exports = sendEmail;