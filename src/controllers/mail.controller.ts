import nodemailer from "nodemailer";
import { transporterConfig } from "../config/mail";

const transporter = nodemailer.createTransport(transporterConfig);

export const sendMail = async (mail: {
  to: string;
  subject: string;
  text: string;
}) => {
  const { to, subject, text } = mail;

  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
  };

  console.log("transporterConfig:", transporterConfig);

  try {
    await transporter.sendMail(mailOptions);
    return {
      isError: false,
      error: null,
      message: "Mail sent successfully",
    };
  } catch (error: any) {
    return {
      isError: true,
      error: error.message,
      message: "Error occurred while sent mail",
    };
  }
};
