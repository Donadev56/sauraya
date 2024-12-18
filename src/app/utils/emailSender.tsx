"use server"

import nodemailer from "nodemailer";

export const sendEmail = async (email: string, otp: string) => {
  const subject = "Email Verification - Sauraya AI";
  const text = `
Hello,

Thank you for connecting with Sauraya AI. To verify your email address, please use the following verification code:

${otp}

If you did not request this verification, please disregard this email or contact our support team for assistance.

Best regards,
The Sauraya AI Team
`;

  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: "auth@sauraya.com",
      pass: "donadevChain56###",
    },
  });

  const mailOptions = {
    from: "auth@sauraya.com",
    to: email,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Mail sent successfully!");
    return { success: true, response: "Email sent successfully!" };
  } catch (error) {
    console.error("An error occurred during email transfer:", error);
    return { success: false, response: "Error while sending email." };
  }
};
