const nodemailer = require("nodemailer");
// const transporter=require("../websocket");

async function sendMail(option) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      // secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: option.email,
      subject: option.subject,
      text: option.message,
      html: option.html,
    });

  } catch (err) {
  }
}

module.exports = { sendMail }; 
