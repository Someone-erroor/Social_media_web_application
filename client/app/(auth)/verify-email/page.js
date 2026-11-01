'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/forms/FormField';
import Icon from '@/components/ui/Icon';
import { authService } from '@/services/authService';
import { ROUTES } from '@/lib/routes';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [verifying, setVerifying] = useState(Boolean(token));
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Resend state
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [resending, setResending] = useState(false);
  const [instantVerifying, setInstantVerifying] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [resendPreviewLink, setResendPreviewLink] = useState(null);
  const [showResendForm, setShowResendForm] = useState(!token);

  const handleInstantVerify = async () => {
    if (!resendEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail.trim())) {
      setResendStatus('Please enter your registered email address above first.');
      return;
    }

    setInstantVerifying(true);
    setResendStatus('');
    try {
      const res = await authService.demoVerify({ email: resendEmail.trim() });
      setVerified(true);
      setSuccessMessage(res.message || 'Account verified successfully! You can now sign in.');
    } catch (err) {
      setResendStatus(err.message || 'Could not verify account.');
    } finally {
      setInstantVerifying(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (token) {
      authService
        .verifyEmail({ token })
        .then((res) => {
          if (!ignore) {
            setVerified(true);
            setSuccessMessage(res.message || 'Email verified successfully! You can now sign in.');
          }
        })
        .catch((err) => {
          if (!ignore) {
            setErrorMessage(err.message || 'Invalid or expired verification token.');
            setShowResendForm(true);
          }
        })
        .finally(() => {
          if (!ignore) {
            setVerifying(false);
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail.trim())) {
      setResendStatus('Please enter a valid email address.');
      return;
    }

    setResending(true);
    setResendStatus('');
    setResendPreviewLink(null);

    try {
      const res = await authService.resendVerification({ email: resendEmail.trim() });
      setResendStatus(res.message || 'Verification link sent if an account exists.');

      // Refresh the latest local email preview in development
      if (res?.deliveryMode === 'preview' || process.env.NODE_ENV !== 'production') {
        try {
          const devMail = await authService.getDevMailboxLatest();
          if (devMail?.email?.link) {
            setResendPreviewLink(devMail.email.link);
          }
        } catch {
          // non-blocking
        }
      }
    } catch (err) {
      setResendStatus(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="shadow-md border-[#263640] bg-[#151F29] text-center">
      <CardHeader className="items-center pb-2 border-b border-[#263640]">
        <div className="w-14 h-14 rounded-2xl bg-[#1D2A35] border border-[#263640] flex items-center justify-center text-[#19D3E3] mb-2 shadow-xs">
          <Icon name="mail" className="w-7 h-7" />
        </div>
        <CardTitle className="text-xl font-bold text-[#F4F8FA]">
          {verified ? 'Email Verified!' : token ? 'Verifying Email' : 'Check your email'}
        </CardTitle>
        <CardDescription className="max-w-xs mx-auto">
          {verified
            ? 'Your email has been confirmed. You can now access your Looply account.'
            : token
            ? 'Confirming your Looply account credentials...'
            : "We've sent a verification link to your registered email address."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-3 text-[#F4F8FA]">
        {/* Verification Status Feedback */}
        {verifying && (
          <div className="p-4 rounded-xl bg-[#1D2A35] border border-[#263640] text-xs text-[#19D3E3] flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#263640] border-t-[#19D3E3] rounded-full animate-spin" />
            <span>Validating security token with Looply server...</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-[#FF5C70]/10 border border-[#FF5C70]/30 text-xs text-[#FF5C70] text-left space-y-1">
            <p className="font-semibold">Verification Failed</p>
            <p>{errorMessage}</p>
            <p className="text-[#9BAAB4] pt-1">
              💡 <em>You can still activate your account immediately by entering your email below and clicking <strong>Instant Verify</strong>.</em>
            </p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-[#32D583]/10 border border-[#32D583]/30 text-xs text-[#32D583] text-left space-y-1">
            <p className="font-semibold text-[#F4F8FA]">Success!</p>
            <p>{successMessage}</p>
          </div>
        )}

        {verified ? (
          <Button
            href={ROUTES.PUBLIC.LOGIN}
            variant="primary"
            size="lg"
            className="w-full shadow-md shadow-[#19D3E3]/20 font-bold"
          >
            Sign In to Looply &rarr;
          </Button>
        ) : (
          <>
            {/* Informational Instructions */}
            <div className="p-4 rounded-xl bg-[#101A22] border border-[#263640] text-xs text-[#9BAAB4] text-left space-y-2">
              <p className="font-semibold text-[#F4F8FA]">Verification Options:</p>
              <ul className="list-disc list-inside space-y-1.5 text-[#9BAAB4]">
                <li>
                  <strong className="text-[#F4F8FA]">Email Link:</strong> Click the confirmation link delivered to your registered inbox.
                </li>
                <li>
                  <strong className="text-[#19D3E3]">⚡ Instant Verify (Demo Mode):</strong> Enter your email below and click the Instant Verify button to activate your account immediately without waiting for email delivery.
                </li>
              </ul>
            </div>

            {/* Resend Verification Form */}
            {showResendForm && (
              <form onSubmit={handleResend} className="pt-2 text-left space-y-3">
                <FormField id="resend-email" label="Account Email:">
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    icon={<Icon name="mail" className="w-4 h-4" />}
                  />
                </FormField>

                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    variant="outline"
                    size="md"
                    className="w-full"
                    disabled={resending || instantVerifying}
                  >
                    {resending ? 'Sending Link...' : 'Resend Verification Email'}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/40 hover:bg-[#19D3E3] hover:text-[#080D12] font-semibold transition-all shadow-xs"
                    disabled={instantVerifying || resending}
                    onClick={handleInstantVerify}
                  >
                    {instantVerifying ? 'Activating Account...' : '⚡ Instant Verify & Activate Account'}
                  </Button>
                </div>

                {resendStatus && (
                  <p className="text-xs text-center text-[#9BAAB4] mt-2">
                    {resendStatus}
                  </p>
                )}

                {resendPreviewLink && (
                  <div className="p-3 rounded-xl bg-[#101A22] border border-[#19D3E3]/30 text-xs text-center space-y-2 mt-2">
                    <p className="font-semibold text-[#19D3E3]">
                      New verification link generated in local dev mailbox:
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <a
                        href={resendPreviewLink}
                        className="inline-block px-3 py-1.5 rounded-lg bg-[#19D3E3] text-[#080D12] font-bold text-xs hover:bg-[#00B8C8] transition-colors"
                      >
                        Verify with New Link &rarr;
                      </a>
                      <a
                        href="http://localhost:5000/api/__dev/mailbox/latest"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block px-3 py-1.5 rounded-lg border border-[#263640] bg-[#151F29] text-[#19D3E3] font-medium text-xs hover:bg-[#1D2A35] transition-colors"
                      >
                        Open Dev Mailbox
                      </a>
                    </div>
                  </div>
                )}
              </form>
            )}

            <div className="space-y-2 pt-2 border-t border-[#263640]">
              <Button
                href={ROUTES.PUBLIC.LOGIN}
                variant="ghost"
                size="md"
                className="w-full text-xs text-[#9BAAB4]"
              >
                Back to Sign In
              </Button>
            </div>
          </>
        )}

        <div className="pt-3 border-t border-[#263640] text-xs text-[#9BAAB4]">
          Need to change your email?{' '}
          <Link
            href={ROUTES.PUBLIC.REGISTER}
            className="font-semibold text-[#19D3E3] hover:text-[#00B8C8] hover:underline"
          >
            Register again
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="shadow-md border-[#263640] bg-[#151F29] text-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#263640] border-t-[#19D3E3] rounded-full animate-spin" />
            <p className="text-xs text-[#9BAAB4]">Loading verification portal...</p>
          </div>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
