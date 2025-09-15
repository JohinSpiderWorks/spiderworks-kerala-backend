const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, otp) => {
  try {
    // Create a transporter using your email provider's SMTP settings
    const transporter = nodemailer.createTransport({
      service: "gmail", // Change to your email provider if needed
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
      port: 465,
      secure: true,
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Admin Login",
      text: `Your OTP for admin login is: ${otp}. It is valid for 5 minutes.`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

module.exports = sendOtpEmail;
