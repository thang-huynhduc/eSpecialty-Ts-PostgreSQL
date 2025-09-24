import nodemailer from "nodemailer";

// Khởi tạo transporter với SMTP configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // Use 'smtp.brevo.com' for Brevo
  auth: {
    user: process.env.SMTP_EMAIL, // Your email address (e.g., 'lainquay@gmail.com')
    pass: process.env.SMTP_PASSWORD, // Your email password or app-specific password
  },
});

export const sendOtpEmail = async (toEmail, otpCode, subject, type) => {
  // Mapping type -> text
  const actionMap = {
    register: "registration verification",
    resetPassword: "password reset",
    unlockAccount: "unlocking your account",
  };
  const actionText = actionMap[type] || "your action";

 // HTML content
  const htmlContent = `
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: Arial, Helvetica, sans-serif; background: #f4f4f7; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .header h1 { color: #2a2a2a; }
        .content { font-size: 15px; color: #333; line-height: 1.6; padding: 20px 0; }
        .otp-box { font-size: 22px; font-weight: bold; color: #1a73e8; background: #f0f4ff; padding: 12px; border-radius: 6px; text-align: center; margin: 20px 0; letter-spacing: 3px; }
        .footer { text-align: center; font-size: 13px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>eSpecialty Shopping</h1></div>
        <div class="content">
          <p>Dear User,</p>
          <p>Your One-Time Password (OTP) for <strong>${actionText}</strong> is:</p>
          <div class="otp-box">${otpCode}</div>
          <p>This OTP will expire in <strong>5 minutes</strong>. Please do not share it with anyone.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">&copy; ${new Date().getFullYear()} eSpecialty Shopping. All rights reserved.</div>
      </div>
    </body>
  </html>
  `;


  // Config email
  const mailOptions = {
    from: `"E-Specialty" <${process.env.SMTP_EMAIL}>`, // Sender name and email
    to: toEmail,
    subject,
    html: htmlContent,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", result);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return false;
  }
};