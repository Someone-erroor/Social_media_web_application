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
    <Card className="shadow-md border-[#2D2938] bg-[#1E1B26]">
      <CardHeader className="text-center pb-2 border-b border-[#2D2938]">
        <div className="w-12 h-12 rounded-2xl bg-[#FF6257]/15 border border-[#FF6257]/30 flex items-center justify-center text-[#FF6257] mx-auto mb-2 shadow-xs">
          <Icon name="lock" className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-bold font-display text-[#F6F2EA]">Reset your password</CardTitle>
        <CardDescription className="text-xs text-[#777580]">
          Enter the email associated with your account and we&apos;ll send instructions to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 text-[#F6F2EA]">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-[#D5F36A]/10 border border-[#D5F36A]/30 text-xs text-[#D5F36A] space-y-2">
            <p className="font-semibold text-[#F6F2EA]">Check your inbox</p>
            <p>{successMessage}</p>
            <p className="text-[11px] text-[#777580]">
              The reset link will remain active for 30 minutes. Be sure to check your spam or promotions folder.
            </p>
          </div>
        )}

        {devResetLink && (
          <div className="p-4 rounded-xl bg-[#17151D] border border-[#2D2938] text-[#F6F2EA] text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-[#FF6257]">
              <Icon name="mail" className="w-4 h-4 text-[#FF6257]" />
              <span>Development Email Preview</span>
            </div>
            <p className="text-[#777580] leading-relaxed">
              Your password reset link is ready in the local preview mailbox. Click below to proceed with setting a new password:
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <a
                href={devResetLink}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FF6257] hover:opacity-90 text-[#110F17] font-bold text-xs shadow-xs transition-colors"
              >
                <span>Reset Password Now &rarr;</span>
              </a>
              <a
                href="http://localhost:5000/api/__dev/mailbox/latest"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#2D2938] bg-[#1E1B26] text-[#FF6257] hover:bg-[#17151D] font-medium text-xs transition-colors"
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
              className="w-full shadow-md shadow-[#FF6257]/20"
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

        <div className="pt-4 border-t border-[#2D2938] text-center text-xs text-[#777580]">
          Remember your password?{' '}
          <Link
            href={ROUTES.PUBLIC.LOGIN}
            className="font-semibold text-[#FF6257] hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
