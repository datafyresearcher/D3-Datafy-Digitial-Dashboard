import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { fullName, email, subject, message } = await request.json();

    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: "Full name, email, and message are required." },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = process.env.SMTP_PORT || "587";
    const recipient = "researcher@datafyassociates.com";

    if (smtpHost && smtpUser && smtpPass) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpUser,
        to: recipient,
        subject: subject || "Inquiry from Datafy Website",
        text: `Full Name: ${fullName}\nEmail: ${email}\n\nMessage:\n${message}`,
        replyTo: email,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      {
        error: "Email delivery is not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env.local file.",
      },
      { status: 500 }
    );
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Failed to process your request." },
      { status: 500 }
    );
  }
}
