'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormField from '@/components/forms/FormField';
import Icon from '@/components/ui/Icon';
import { authService } from '@/services/authService';
import { ROUTES } from '@/lib/routes';

function VerifyEmailContent() {
  const router = useRouter();
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
  const [resendStatus, setResendStatus] = useState('');
  const [showResendForm, setShowResendForm] = useState(!token);

  useEffect(() => {
    let ignore = false;
    if (token) {
      authService
        .verifyEmail({ token, email: emailParam })
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
  }, [token, emailParam]);

  // Automatic redirect to sign in once verified
  useEffect(() => {
    if (verified) {
      const activeEmail = resendEmail || emailParam;
      const redirectTimer = setTimeout(() => {
        const destination = `${ROUTES.PUBLIC.LOGIN}?verified=true${
          activeEmail ? `&email=${encodeURIComponent(activeEmail)}` : ''
        }`;
        router.push(destination);
      }, 2500);

      return () => clearTimeout(redirectTimer);
    }
  }, [verified, emailParam, resendEmail, router]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail.trim())) {
      setResendStatus('Please enter a valid email address.');
      return;
    }

    setResending(true);
    setResendStatus('');

    try {
      const res = await authService.resendVerification({ email: resendEmail.trim() });
      if (res?.alreadyVerified) {
        setVerified(true);
        setSuccessMessage(res.message || 'This account is already verified! You can sign in immediately.');
      } else {
        setResendStatus(res.message || 'A verification link has been sent to your email address.');
      }
    } catch (err) {
      setResendStatus(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="shadow-sm border-[#E7E5E0] bg-[#FFFFFF] text-center">
      <CardHeader className="items-center pb-2 border-b border-[#E7E5E0]">
        <div className="w-14 h-14 rounded-2xl bg-[#EEEAFE] border border-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF] mb-2 shadow-xs">
          <Icon name="mail" className="w-7 h-7" />
        </div>
        <CardTitle className="text-xl font-bold font-display text-[#1E1E24]">
          {verified ? 'Email Verified!' : token ? 'Verifying Email' : 'Check your email'}
        </CardTitle>
        <CardDescription className="max-w-xs mx-auto text-xs text-[#6B6B73]">
          {verified
            ? 'Your email has been confirmed. Redirecting to sign in...'
            : token
            ? 'Confirming your Looply account credentials...'
            : "We've sent a verification link to your registered email address."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-4 text-[#1E1E24]">
        {/* Verification Status Feedback */}
        {verifying && (
          <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#6C63FF] flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-[#E7E5E0] border-t-[#6C63FF] rounded-full animate-spin" />
            <span className="font-medium">Validating security token with Looply server...</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] text-left space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <Icon name="alertCircle" className="w-4 h-4" />
              Verification Link Expired or Invalid
            </p>
            <p className="text-[#6B6B73]">
              {errorMessage}
            </p>
            <p className="text-[#6B6B73]">
              If you have already verified your account, you can sign in directly. Otherwise, request a new verification link below.
            </p>
            <div className="pt-1">
              <Link
                href={ROUTES.PUBLIC.LOGIN}
                className="inline-block px-3 py-1.5 rounded-lg bg-[#FF6B6B] text-white font-bold text-xs hover:bg-[#EE5252] transition-colors"
              >
                Go to Sign In &rarr;
              </Link>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] text-left space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <Icon name="check" className="w-4 h-4" />
              Email Successfully Verified!
            </p>
            <p className="text-[#6B6B73]">{successMessage}</p>
            <p className="text-[11px] text-[#6B6B73] italic">
              Redirecting to sign in automatically in a few seconds...
            </p>
          </div>
        )}

        {verified ? (
          <Button
            href={`${ROUTES.PUBLIC.LOGIN}?verified=true${
              emailParam ? `&email=${encodeURIComponent(emailParam)}` : ''
            }`}
            variant="primary"
            size="lg"
            className="w-full shadow-sm font-bold"
          >
            Sign In to Looply Now &rarr;
          </Button>
        ) : (
          <>
            {/* Informational Instructions */}
            <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs text-[#6B6B73] text-left space-y-2">
              <p className="font-semibold text-[#1E1E24]">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-[#6B6B73]">
                <li>Open your email inbox (check spam/junk if not received).</li>
                <li>Click the secure verification link inside the email.</li>
                <li>Sign in with your email and password to access Looply.</li>
              </ol>
            </div>

            {/* Resend Verification Form */}
            {showResendForm && (
              <form onSubmit={handleResend} className="pt-2 text-left space-y-3">
                <FormField id="resend-email" label="Need a new verification link?">
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    icon={<Icon name="mail" className="w-4 h-4" />}
                  />
                </FormField>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full font-bold shadow-sm"
                  disabled={resending}
                >
                  {resending ? 'Sending Verification Link...' : 'Resend Verification Email'}
                </Button>

                {resendStatus && (
                  <p className="text-xs text-center text-[#6C63FF] mt-2 font-medium">
                    {resendStatus}
                  </p>
                )}
              </form>
            )}

            <div className="space-y-2 pt-2 border-t border-[#E7E5E0]">
              <Button
                href={ROUTES.PUBLIC.LOGIN}
                variant="ghost"
                size="md"
                className="w-full text-xs text-[#6B6B73] hover:text-[#1E1E24]"
              >
                Back to Sign In
              </Button>
            </div>
          </>
        )}

        <div className="pt-3 border-t border-[#E7E5E0] text-xs text-[#6B6B73]">
          Need to change your email?{' '}
          <Link
            href={ROUTES.PUBLIC.REGISTER}
            className="font-semibold text-[#6C63FF] hover:underline"
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
        <Card className="shadow-sm border-[#E7E5E0] bg-[#FFFFFF] text-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#E7E5E0] border-t-[#6C63FF] rounded-full animate-spin" />
            <p className="text-xs text-[#6B6B73]">Loading verification portal...</p>
          </div>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
