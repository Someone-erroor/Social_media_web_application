import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import {
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate
} from './email-template.service.js';

/**
 * In-memory test mail outbox.
 * Only populated in non-production test mode or when SMTP credentials are not configured in test runs.
 */
const testMailOutbox = [];
let forceTestOutbox = env.isTest;

/**
 * Creates and configures the Nodemailer transporter.
 * If in test mode or forceTestOutbox is active, messages are routed to the test outbox.
 * Never uses a mock/outbox transport in production.
 *
 * @returns {object|null} Transporter instance or null
 */
const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  const port = env.SMTP_PORT || 587;
  const secure = env.SMTP_SECURE || port === 465;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000
  });
};

/**
 * Checks if a real SMTP transporter is configured and operational.
 *
 * @returns {Promise<boolean>}
 */
export const verifySmtpConnection = async () => {
  if (!env.isSmtpConfigured) return false;
  try {
    const transporter = createTransporter();
    if (!transporter) return false;
    await transporter.verify();
    return true;
  } catch (err) {
    console.error(`[SMTP Warning] Verification failed: ${err.message}`);
    return false;
  }
};

/**
 * Core sendMail function.
 * Routes through real Nodemailer or isolated test outbox depending on environment.
 * Never logs credentials, tokens, or private user secrets.
 *
 * @param {object} mailOptions
 * @param {string} mailOptions.to - Recipient email
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.html - HTML body
 * @param {string} mailOptions.text - Plain text body
 * @returns {Promise<{ success: boolean, messageId?: string, isTestOutbox?: boolean }>}
 */
export const sendMail = async ({ to, subject, html, text }) => {
  if (!to) {
    throw new Error('Email recipient address ("to") is required.');
  }

  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html
  };

  // 1. If GMAIL_WEBHOOK_URL is configured, dispatch via Google Apps Script (Sends directly from Gmail to ANY email worldwide on Port 443)
  if (env.GMAIL_WEBHOOK_URL && !forceTestOutbox) {
    try {
      const gRes = await fetch(env.GMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, text }),
        redirect: 'follow'
      });
      const gData = await gRes.json().catch(() => null);
      if (gRes.ok || gData?.success) {
        return {
          success: true,
          messageId: `gmail-${Date.now()}`,
          isTestOutbox: false
        };
      }
      console.warn(`[Gmail Webhook Notice] Delivery returned: ${gData?.error || gRes.status}`);
    } catch (gErr) {
      console.warn(`[Gmail Webhook Error] Could not dispatch via Gmail Webhook: ${gErr.message}`);
    }
  }

  // 2. If BREVO_API_KEY is configured, dispatch via Brevo HTTPS REST API (Port 443 - zero domain restriction, sends to ANY recipient)
  if (env.BREVO_API_KEY && !forceTestOutbox) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Looply', email: env.SMTP_USER || 'ravikishan76768@gmail.com' },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text
        })
      });
      const brevoData = await brevoRes.json().catch(() => null);
      if (brevoRes.ok && (brevoData?.messageId || brevoRes.status === 201 || brevoRes.status === 200)) {
        return {
          success: true,
          messageId: brevoData?.messageId || `brevo-${Date.now()}`,
          isTestOutbox: false
        };
      }
      console.warn(`[Brevo Notice] Delivery to ${to} returned: ${brevoData?.message || brevoRes.status}`);
    } catch (bErr) {
      console.warn(`[Brevo Error] Could not dispatch via Brevo: ${bErr.message}`);
    }
  }

  // 3. If RESEND_API_KEY is configured, dispatch via Resend HTTPS API (Port 443 - never blocked by cloud firewalls)
  if (env.RESEND_API_KEY && !forceTestOutbox) {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Looply <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          text
        })
      });

      const resendData = await resendResponse.json().catch(() => null);
      if (resendResponse.ok && resendData?.id) {
        return {
          success: true,
          messageId: resendData.id,
          isTestOutbox: false
        };
      }
      console.warn(`[Resend Notice] Delivery to ${to} returned: ${resendData?.message || resendResponse.status}`);
    } catch (resendErr) {
      console.warn(`[Resend Notice] Could not dispatch via Resend: ${resendErr.message}`);
    }
  }

  const transporter = createTransporter();

  // If real SMTP is configured and available, dispatch via Nodemailer
  if (transporter && !forceTestOutbox) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
        isTestOutbox: false
      };
    } catch (sendErr) {
      console.error(`[Email Service Error] Failed to send email to ${to}: ${sendErr.message}`);
      throw new Error(`Email delivery failed: ${sendErr.message}`);
    }
  }

  // In test mode or when SMTP is not configured in development, capture into testMailOutbox
  if (env.isTest || forceTestOutbox || !env.isProduction) {
    const testRecord = {
      messageId: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      to,
      subject,
      text,
      html,
      sentAt: new Date().toISOString()
    };
    testMailOutbox.push(testRecord);
    return {
      success: true,
      messageId: testRecord.messageId,
      isTestOutbox: true
    };
  }

  // In production without SMTP: raise clear operational error
  throw new Error('SMTP credentials are not configured on this server. Email cannot be dispatched.');
};

/**
 * Dispatches account email verification message.
 *
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.name - User's name
 * @param {string} params.token - Raw verification token (not logged)
 * @returns {Promise<object>} Send result
 */
export const sendVerificationEmail = async ({ to, name, token }) => {
  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;
  const template = getVerificationEmailTemplate({
    name,
    verificationUrl
  });

  return sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

/**
 * Dispatches password recovery reset email.
 *
 * @param {object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.name - User's name
 * @param {string} params.token - Raw reset token (not logged)
 * @returns {Promise<object>} Send result
 */
export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const template = getResetPasswordEmailTemplate({
    name,
    resetUrl
  });

  return sendMail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

/**
 * Test Outbox Inspection Helpers (for automated test suites).
 */
export const getTestOutbox = () => [...testMailOutbox];
export const getLastTestEmail = () => testMailOutbox[testMailOutbox.length - 1] || null;
export const clearTestOutbox = () => {
  testMailOutbox.length = 0;
};
export const setForceTestOutbox = (val) => {
  forceTestOutbox = Boolean(val);
};

export default {
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  verifySmtpConnection,
  getTestOutbox,
  getLastTestEmail,
  clearTestOutbox,
  setForceTestOutbox
};

