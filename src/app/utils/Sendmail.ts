// utils/sendMail.ts
import { render } from "@react-email/render";
import { CredentialsEmail } from "@/app/components/emails/CredentialsEmail";
import nodemailer from "nodemailer";
import React from "react"; // Make sure React is imported

export async function sendCredentialsMail(email: string, password: string) {
   const emailComponent = React.createElement(CredentialsEmail, { 
    email: email, 
    password: password 
  });

   const html = await render(emailComponent);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });

  await transporter.sendMail({
    from: `"Lampros Tech Root" `,
    to: email,
    subject: "Your Credentials for login",
    html, // ✅ Now this is a plain string
  });
}
