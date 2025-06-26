import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
   debug: true,
  logger: true
});

export const contactMail = async (
  senderName,
  senderEmail,
  senderNumber,
  message,
  sender

) => {
  await transporter.sendMail({
    from: `${senderName} <ultragigachadno1@gmail.com>`,
    to: sender, 
    subject: `New Contact Message from ${senderName}`,
    text: `
        Name: ${senderName}
        Email: ${senderEmail}
        Phone: ${senderNumber || "Not provided"}
        Message: ${message}
      `,
    html: `
         <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Contact Message</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 100px;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                <a href="mailto:${senderEmail}">${senderEmail}</a>
              </td>
            </tr>
            ${
              senderNumber
                ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
                <a href="tel:${senderNumber}">${senderNumber}</a>
              </td>
            </tr>
            `
                : ""
            }
          </table>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-top: 20px;">
            <h3 style="margin-top: 0; color: #2c3e50;">Message:</h3>
            <p style="white-space: pre-line; margin-bottom: 0;">${message}</p>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #7f8c8d;">
            This message was sent via the contact form on your website.
          </p>
        </div>
        `,
  });
};
