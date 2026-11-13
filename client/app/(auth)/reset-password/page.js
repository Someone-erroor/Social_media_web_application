'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { authService } from '@/services/authService';
import { ROUTES } from '@/lib/routes';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token') || '';

  const [token, setToken] = useState(urlToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!token.trim()) {
      setErrorMessage('Password reset token is required. Please use the link sent to your email.');
      return;
    }

    if (!password) {
      setErrorMessage('New password is required.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword({
        token: token.trim(),
        password,
        confirmPassword
      });
      setSubmitted(true);
      setSuccessMessage(
        res.message || 'Password has been reset successfully. You can now sign in with your new password.'
      );
    } catch (err) {
      setErrorMessage(err.message || 'Invalid or expired password reset token.');
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
        <CardTitle className="text-xl font-bold text-[#1E1E24]">Set new password</CardTitle>
        <CardDescription className="text-xs text-[#6B6B73]">
          Your new password must be at least 8 characters long and different from previous passwords.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 text-[#1E1E24]">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-[#E8F7EE] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] space-y-3 font-medium">
            <p className="font-semibold text-[#1E1E24]">Password Reset Successful</p>
            <p>{successMessage}</p>
            <Button
              href={ROUTES.PUBLIC.LOGIN}
              variant="primary"
              size="lg"
              className="w-full shadow-xs font-bold"
            >
              Sign In with New Password
            </Button>
          </div>
        )}

        {!submitted && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!urlToken && (
              <FormField
                id="reset-token"
                label="Reset Token"
                required
                helperText="Paste the security token provided in your reset email"
              >
                <Input
                  id="reset-token"
                  type="text"
                  placeholder="Paste reset token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </FormField>
            )}

            <FormField
              id="reset-password"
              label="New password"
              required
              helperText="Minimum 8 characters"
            >
              <div className="relative">
                <Input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Icon name="lock" className="w-4 h-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[24px] min-h-[24px] p-1 text-[#6B6B73] hover:text-[#1E1E24] text-xs flex items-center justify-center cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </FormField>

            <FormField
              id="reset-confirm"
              label="Confirm new password"
              required
            >
              <div className="relative">
                <Input
                  id="reset-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<Icon name="lock" className="w-4 h-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[24px] min-h-[24px] p-1 text-[#6B6B73] hover:text-[#1E1E24] text-xs flex items-center justify-center cursor-pointer"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-xs font-bold"
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-[#E7E5E0] text-center text-xs text-[#6B6B73]">
          Remember your credentials?{' '}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="shadow-xs border-[#E7E5E0] bg-white text-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#E7E5E0] border-t-[#6C63FF] rounded-full animate-spin" />
            <p className="text-xs text-[#6B6B73]">Loading password reset portal...</p>
          </div>
        </Card>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
