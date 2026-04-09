import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "InsideOil <noreply@insideoil.it>";

export async function sendWelcomeEmail(to: string, registrationLink: string, planName: string) {
  if (!resend) {
    console.warn("[Email] Resend not configured, skipping welcome email to", to);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to InsideOil — Complete your registration",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 32px;">
          <strong style="font-size: 20px;">InsideOil</strong>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Welcome aboard</h1>
        <p style="color: #666; font-size: 15px; line-height: 1.6;">
          Your <strong>${planName}</strong> subscription is now active. Complete your registration to access the platform.
        </p>
        <a href="${registrationLink}" style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Complete registration
        </a>
        <p style="color: #999; font-size: 12px; line-height: 1.5; margin-top: 32px;">
          This link expires in 72 hours. If you didn't make this purchase, contact us at
          <a href="mailto:info@insideoil.it" style="color: #999;">info@insideoil.it</a>.
        </p>
      </div>
    `,
  });
}

export async function sendReceiptEmail(to: string, planName: string, amount: string, currency: string) {
  if (!resend) {
    console.warn("[Email] Resend not configured, skipping receipt email to", to);
    return;
  }

  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `InsideOil — Payment receipt`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        <div style="margin-bottom: 32px;">
          <strong style="font-size: 20px;">InsideOil</strong>
        </div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Payment received</h1>
        <p style="color: #666; font-size: 15px; line-height: 1.6;">Thank you for subscribing to InsideOil.</p>
        <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #999;">Plan</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${planName}</td></tr>
            <tr><td style="padding: 6px 0; color: #999;">Amount</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${currency}${amount}</td></tr>
            <tr><td style="padding: 6px 0; color: #999;">Date</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${date}</td></tr>
          </table>
        </div>
        <p style="color: #999; font-size: 12px; line-height: 1.5;">
          For billing questions, contact <a href="mailto:info@insideoil.it" style="color: #999;">info@insideoil.it</a>.
        </p>
      </div>
    `,
  });
}
