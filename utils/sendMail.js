const nodemailer = require("nodemailer");
// const transporter=require("../websocket");

async function sendMail(option) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: "izone5.nigeria@gmail.com",
        pass: "xsmtpsib-f14b551b5df332e938fd74985c0315fbfce8c88372b026cb4bc7ddd284abf9be-XzUHJEyrVCSdchOp",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: "izone5.nigeria@gmail.com",
      to: option.email,
      subject: option.subject,
      text: option.message,
      html: option.html,
    });

    console.log("Email sent to user successfully");
  } catch (err) {
    console.log(err);
    console.log("Email not sent");
  }
}

module.exports = { sendMail };
