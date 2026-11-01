import { Router } from 'express';
import { env } from '../config/env.js';
import { getLastTestEmail } from '../services/email.service.js';

const router = Router();

/**
 * Middleware: Strictly restricts dev preview routes to local development and loopback connections.
 * Never accessible in production environments.
 * Does not trust user-supplied Host headers or req.hostname.
 */
const requireDevLoopback = (req, res, next) => {
  // Disable the route completely in production or when preview is explicitly disabled
  if (env.isProduction || !env.isDevEmailPreviewAllowed) {
    return res.status(404).json({
      success: false,
      message: 'Not found'
    });
  }

  // Check the actual socket remote address, never trusting Host header or req.hostname
  const clientIp = (req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip || '').trim();
  // Normalize IPv4-mapped IPv6 loopback addresses (e.g. "::ffff:127.0.0.1" -> "127.0.0.1")
  const normalizedIp = clientIp.replace(/^::ffff:/, '');

  const isLoopback = normalizedIp === '127.0.0.1' || normalizedIp === '::1';

  if (!isLoopback) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Dev preview is restricted to local loopback connections.'
    });
  }

  next();
};

/**
 * GET /api/__dev/mailbox/latest
 * Returns the latest development email record from the in-memory outbox
 * allowing developers to complete email verification and password reset workflows locally.
 */
router.get('/mailbox/latest', requireDevLoopback, (req, res) => {
  const lastEmail = getLastTestEmail();

  if (!lastEmail) {
    return res.status(200).json({
      success: true,
      email: null,
      data: null,
      message: 'Local development mailbox is empty.'
    });
  }

  // Safely extract the action URL (verification or password reset link)
  let extractedLink = null;
  if (lastEmail.text) {
    const textMatch = lastEmail.text.match(/https?:\/\/[^\s"'<>]+/i);
    if (textMatch) extractedLink = textMatch[0];
  }
  if (!extractedLink && lastEmail.html) {
    const htmlMatch = lastEmail.html.match(/href=["'](https?:\/\/[^"']+)["']/i);
    if (htmlMatch) extractedLink = htmlMatch[1];
  }

  const emailType = extractedLink?.includes('verify-email')
    ? 'verification'
    : extractedLink?.includes('reset-password')
    ? 'password_reset'
    : 'transactional';

  const payload = {
    to: lastEmail.to,
    recipient: lastEmail.to,
    subject: lastEmail.subject,
    sentAt: lastEmail.sentAt,
    link: extractedLink,
    actionUrl: extractedLink,
    type: emailType
  };

  return res.status(200).json({
    success: true,
    email: payload,
    data: payload
  });
});

export default router;
