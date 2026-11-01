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

  const [verifying, setVerifying] = useState(Boolean(token));
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [showResendForm, setShowResendForm] = useState(!token);

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

    try {
      const res = await authService.resendVerification({ email: resendEmail.trim() });
      setResendStatus(res.message || 'Verification link sent if an account exists.');
    } catch (err) {
      setResendStatus(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="shadow-md border-slate-200 text-center">
      <CardHeader className="items-center pb-2">
        <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-[#087F8A] mb-2 shadow-xs">
          <Icon name="mail" className="w-7 h-7" />
        </div>
        <CardTitle className="text-xl font-bold">
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

      <CardContent className="space-y-5 pt-3">
        {/* Verification Status Feedback */}
        {verifying && (
          <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-100 text-xs text-[#087F8A] flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-cyan-300 border-t-[#16B8C8] rounded-full animate-spin" />
            <span>Validating security token with Looply server...</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-left space-y-1">
            <p className="font-semibold">Verification Failed</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-left space-y-1">
            <p className="font-semibold">Success!</p>
            <p>{successMessage}</p>
          </div>
        )}

        {verified ? (
          <Button
            href={ROUTES.PUBLIC.LOGIN}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Sign In to Looply
          </Button>
        ) : (
          <>
            {/* Informational Instructions */}
            {!token && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 text-left space-y-2">
                <p className="font-semibold text-slate-800">Verification Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-500">
                  <li>Open the confirmation email in your inbox.</li>
                  <li>Click the secure verification link.</li>
                  <li>Sign in with your email and password.</li>
                </ol>
              </div>
            )}

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
                  variant="outline"
                  size="md"
                  className="w-full"
                  disabled={resending}
                >
                  {resending ? 'Sending Link...' : 'Resend Verification Email'}
                </Button>

                {resendStatus && (
                  <p className="text-xs text-center text-slate-600 mt-2">
                    {resendStatus}
                  </p>
                )}
              </form>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Button
                href={ROUTES.PUBLIC.LOGIN}
                variant="ghost"
                size="md"
                className="w-full text-xs text-slate-600"
              >
                Back to Sign In
              </Button>
            </div>
          </>
        )}

        <div className="pt-3 border-t border-slate-100 text-xs text-slate-600">
          Need to change your email?{' '}
          <Link
            href={ROUTES.PUBLIC.REGISTER}
            className="font-semibold text-[#087F8A] hover:text-[#087F8A] hover:underline"
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
        <Card className="shadow-md border-slate-200 text-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-200 border-t-[#16B8C8] rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Loading verification portal...</p>
          </div>
        </Card>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
