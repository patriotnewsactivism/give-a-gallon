import { Email } from "@convex-dev/auth/providers/Email";
import { APP_NAME } from "./constants";

declare const process: { env: Record<string, string | undefined> };

function generateOTP() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

async function sendEmail({
  email,
  token,
  subject,
  heading,
  description,
}: {
  email: string;
  token: string;
  subject: string;
  heading: string;
  description: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@give-a-gallon.com";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it to your Convex environment variables.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${APP_NAME} <${fromEmail}>`,
      to: [email],
      subject: `${subject} — ${APP_NAME}`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">${heading}</h2>
          <p style="color: #666;">${description}</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333;">${token}</span>
          </div>
          <p style="color: #999; font-size: 12px;">This code expires in 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Sent by ${APP_NAME}</p>
        </div>
      `,
      text: `${heading}\n\n${description}\n\nYour code: ${token}\n\nExpires in 15 minutes.`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend error: ${error}`);
  }
}

export const ResendEmail = Email({
  id: "resend-email",
  maxAge: 60 * 15, // 15 minutes

  async generateVerificationToken() {
    return generateOTP();
  },

  async sendVerificationRequest({ identifier: email, token }) {
    await sendEmail({
      email,
      token,
      subject: "Verify your email",
      heading: "Verify your email",
      description: "Use this code to verify your account:",
    });
  },
});

export const ResendPasswordReset = Email({
  id: "resend-password-reset",
  maxAge: 60 * 15, // 15 minutes

  async generateVerificationToken() {
    return generateOTP();
  },

  async sendVerificationRequest({ identifier: email, token }) {
    await sendEmail({
      email,
      token,
      subject: "Reset your password",
      heading: "Reset your password",
      description: "Use this code to reset your password:",
    });
  },
});
