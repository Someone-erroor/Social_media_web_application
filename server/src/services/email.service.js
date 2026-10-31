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
  // In production, strictly require real SMTP configuration
  if (env.isProduction) {
    if (!env.isSmtpConfigured) {
      return null;
    }
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  // If SMTP is fully configured in non-production and test outbox is not forced, use real SMTP
  if (env.isSmtpConfigured && !forceTestOutbox) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  // Development/Test fallback outbox transport
  return null;
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
  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
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

