import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || '';
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS || '';
const smtpFrom = process.env.SMTP_FROM || `"MyMobPay" <${smtpUser || 'noreply@mymob.tech'}>`;

export function isSmtpConfigured() {
  return Boolean(smtpUser && smtpPass);
}

export function getTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

/**
 * Send an OTP-only email with a clean 6-digit code box
 */
export async function sendOtpEmail({ to, otp }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[MAILER DEV MODE] No SMTP configured. 6-digit OTP for ${to}: [${otp}]`);
    return { devMode: true, otp };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Verification Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 30px 15px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e9f2; padding: 32px 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0;">MyMob<span style="color: #2c60ff;">Pay</span></h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Unified Fintech Gateway</p>
        </div>

        <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 10px 0; text-align: center;">Your Verification Code</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0; text-align: center;">
          Please enter this 6-digit code on the sign-in screen to access your merchant dashboard:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: #f0f4ff; border: 2px solid #2c60ff; border-radius: 10px; padding: 14px 28px;">
            <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1e40af; font-family: monospace;">${otp}</span>
          </div>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center; margin: 20px 0 0 0;">
          This code expires in 10 minutes. For your security, never share this code with anyone.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} MyMobPay. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: smtpFrom,
    to,
    subject: `Your 6-Digit Verification Code: ${otp}`,
    text: `Your MyMobPay 6-digit verification code is: ${otp}. It will expire in 10 minutes.`,
    html,
  });
}

/**
 * Send a Link-only email with a one-click sign-in button
 */
export async function sendMagicLinkEmail({ to, actionLink }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[MAILER DEV MODE] No SMTP configured. Magic Link for ${to}: ${actionLink}`);
    return { devMode: true, actionLink };
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your One-Click Sign-In Link</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fb; margin: 0; padding: 30px 15px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e9f2; padding: 32px 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0;">MyMob<span style="color: #2c60ff;">Pay</span></h1>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Unified Fintech Gateway</p>
        </div>

        <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin: 0 0 10px 0; text-align: center;">Your Sign-In Link</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0; text-align: center;">
          Click the button below to sign in instantly to your MyMobPay merchant dashboard without entering a password or code:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionLink}" style="display: inline-block; background: #2c60ff; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 10px rgba(44,96,255,0.3);">
            Sign in to Dashboard &rarr;
          </a>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center; margin: 24px 0 0 0;">
          This link will expire shortly and can only be used once.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} MyMobPay. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: smtpFrom,
    to,
    subject: 'Your One-Click Sign-In Link for MyMobPay',
    text: `Click the link below to sign in to your MyMobPay dashboard:\n\n${actionLink}\n\nThis link expires shortly.`,
    html,
  });
}
