'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { authService } from '@/services/authService';
import { ROUTES } from '@/lib/routes';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [devResetLink, setDevResetLink] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.forgotPassword({ email: trimmed });
      setSubmitted(true);
      setSuccessMessage(
        res.message || 'If an account exists with this email, password reset instructions have been sent.'
      );
      try {
        const devMail = await authService.getDevMailboxLatest();
        if (devMail?.email?.link && devMail?.email?.type === 'password_reset') {
          setDevResetLink(devMail.email.link);
        }
      } catch {
        // non-blocking
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to process password reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xs border-[#E7E5E0] bg-white">
      <CardHeader className="text-center pb-2 border-b border-[#E7E5E0]">
        <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] border border-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF] mx-auto mb-2 shadow-xs">
          <Icon name="lock" className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-bold text-[#1E1E24]">Reset your password</CardTitle>
        <CardDescription className="text-xs text-[#6B6B73]">
          Enter the email associated with your account and we&apos;ll send instructions to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 text-[#1E1E24]">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-[#E8F7EE] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] space-y-2 font-medium">
            <p className="font-semibold text-[#1E1E24]">Check your inbox</p>
            <p>{successMessage}</p>
            <p className="text-[11px] text-[#6B6B73]">
              The reset link will remain active for 30 minutes. Be sure to check your spam or promotions folder.
            </p>
          </div>
        )}

        {devResetLink && (
          <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-[#1E1E24] text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-[#6C63FF]">
              <Icon name="mail" className="w-4 h-4 text-[#6C63FF]" />
              <span>Development Email Preview</span>
            </div>
            <p className="text-[#6B6B73] leading-relaxed">
              Your password reset link is ready in the local preview mailbox. Click below to proceed with setting a new password:
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <a
                href={devResetLink}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#574FE8] text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>Reset Password Now &rarr;</span>
              </a>
              <a
                href="http://localhost:5000/api/__dev/mailbox/latest"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E7E5E0] bg-white text-[#6C63FF] hover:bg-[#EEEAFE] font-medium text-xs transition-colors"
              >
                <span>Open Local Email Preview</span>
              </a>
            </div>
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField id="forgot-email" label="Email address" required>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Icon name="mail" className="w-4 h-4" />}
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-xs font-bold"
              disabled={loading}
            >
              {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
            </Button>
          </form>
        ) : (
          <div className="space-y-3 pt-2">
            <Button
              href={ROUTES.PUBLIC.LOGIN}
              variant="outline"
              size="md"
              className="w-full"
            >
              Return to Sign In
            </Button>
          </div>
        )}

        <div className="pt-4 border-t border-[#E7E5E0] text-center text-xs text-[#6B6B73]">
          Remember your password?{' '}
          <Link
            href={ROUTES.PUBLIC.LOGIN}
            className="font-semibold text-[#6C63FF] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
