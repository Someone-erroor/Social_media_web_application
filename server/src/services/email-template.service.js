/**
 * Email Template Service for Looply
 * Connect. Share. Express.
 *
 * Provides responsive, professionally designed HTML email templates
 * and plain-text fallback alternatives for authentication workflows.
 */

/**
 * Generates email content for account email verification.
 *
 * @param {object} params
 * @param {string} params.name - User's display name
 * @param {string} params.verificationUrl - Direct URL link to verify email
 * @returns {{ subject: string, html: string, text: string }}
 */
export const getVerificationEmailTemplate = ({ name, verificationUrl }) => {
  const safeName = name || 'there';

  const subject = 'Verify your email address — Looply';

  const text = `Hi ${safeName},

Welcome to Looply! Please verify your email address to activate your account and start sharing with the community.

Verify your email by clicking the link below:
${verificationUrl}

This verification link will expire in 24 hours.

If you did not create a Looply account, please disregard this email.

— The Looply Team
Connect. Share. Express.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .logo { font-size: 24px; font-weight: 800; color: #4f46e5; text-decoration: none; display: inline-block; margin-bottom: 24px; }
    .logo-tag { font-size: 12px; color: #64748b; font-weight: 500; margin-left: 6px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25); }
    .alt-link { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 24px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 28px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">
        Looply <span class="logo-tag">Connect. Share. Express.</span>
      </div>
      <h1>Verify your email address</h1>
      <p>Hi ${safeName},</p>
      <p>Thank you for joining Looply! Before you can sign in and start sharing with the community, please confirm that this email address belongs to you.</p>
      <div class="btn-container">
        <a href="${verificationUrl}" class="btn" target="_blank" rel="noopener noreferrer">Verify Email Address</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">This verification link will expire in <strong>24 hours</strong>. If you did not sign up for Looply, you can safely ignore this email.</p>
      <div class="alt-link">
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Button not working? Copy and paste this link into your browser:</p>
        <a href="${verificationUrl}" style="color: #4f46e5; text-decoration: underline;">${verificationUrl}</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Looply. All rights reserved.<br>
      You received this transactional email because an account was registered with this email address.
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
};

/**
 * Generates email content for password recovery reset.
 *
 * @param {object} params
 * @param {string} params.name - User's display name
 * @param {string} params.resetUrl - Direct URL link to reset password
 * @returns {{ subject: string, html: string, text: string }}
 */
export const getResetPasswordEmailTemplate = ({ name, resetUrl }) => {
  const safeName = name || 'there';

  const subject = 'Reset your Looply password';

  const text = `Hi ${safeName},

We received a request to reset your Looply account password.

To set a new password, click the link below:
${resetUrl}

This password reset link will expire in 30 minutes.

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account remains secure.

— The Looply Team
Connect. Share. Express.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .logo { font-size: 24px; font-weight: 800; color: #4f46e5; text-decoration: none; display: inline-block; margin-bottom: 24px; }
    .logo-tag { font-size: 12px; color: #64748b; font-weight: 500; margin-left: 6px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25); }
    .alt-link { font-size: 12px; color: #94a3b8; word-break: break-all; margin-top: 24px; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 28px; line-height: 1.5; }
    .security-note { padding: 12px 16px; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; color: #991b1b; font-size: 13px; line-height: 1.5; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">
        Looply <span class="logo-tag">Connect. Share. Express.</span>
      </div>
      <h1>Reset your password</h1>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset the password for your Looply account. Click the button below to choose a new password.</p>
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">This password reset link will expire in <strong>30 minutes</strong>.</p>
      <div class="security-note">
        If you did not request a password reset, you can safely ignore this email. Your current password remains completely secure.
      </div>
      <div class="alt-link">
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">Button not working? Copy and paste this link into your browser:</p>
        <a href="${resetUrl}" style="color: #4f46e5; text-decoration: underline;">${resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Looply. All rights reserved.<br>
      This is a security notification sent to the email address registered with your account.
    </div>
  </div>
</body>
</html>`;

  return { subject, html, text };
};

export default {
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate
};

