'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';

export default function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const isAdminMode = searchParams ? searchParams.get('admin') === 'true' : false;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = await login({
        email: email.trim(),
        password
      });

      if (isAdminMode && data?.user?.role !== 'admin') {
        setErrorMessage('This account is a standard user account. Please sign in with an Administrator account to access the Administration Console.');
      }
    } catch (err) {
      if (err.isNetworkError || err.status === 0) {
        setErrorMessage('Unable to reach the backend server. Please verify the API server is running on http://localhost:5000.');
      } else if (err.status === 401) {
        setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials.');
      } else if (err.status === 403) {
        setErrorMessage(err.message || 'Your account is unverified or has been suspended.');
      } else if (err.status >= 500) {
        setErrorMessage('The server encountered an internal error. Please try again in a moment.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-2xl shadow-black/50 border-[#263640] bg-[#151F29]">
      <CardHeader className="text-center pb-2">
        {isAdminMode ? (
          <div className="flex flex-col items-center gap-1.5 pb-1">
            <div className="w-12 h-12 rounded-2xl bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30 flex items-center justify-center mb-1 shadow-sm shadow-[#19D3E3]/15">
              <Icon name="shield" className="w-6 h-6 text-[#19D3E3]" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#19D3E3] bg-[#101A22] border border-[#19D3E3]/30 px-2 py-0.5 rounded">
              Administrator Portal
            </span>
            <CardTitle className="text-xl font-bold text-[#F4F8FA]">Admin Sign In</CardTitle>
            <CardDescription className="text-xs text-[#9BAAB4]">
              Enter administrator ID and password to access platform controls
            </CardDescription>
          </div>
        ) : (
          <div className="text-center pb-1">
            <CardTitle className="text-xl font-bold text-[#F4F8FA]">Welcome back</CardTitle>
            <CardDescription className="text-xs text-[#9BAAB4]">
              Enter your credentials to access your Looply social feed
            </CardDescription>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FF6F61]/10 border border-[#FF6F61]/30 text-[#FF6F61] text-xs"
          >
            <Icon name="alertCircle" className="w-4 h-4 shrink-0 mt-0.5 text-[#FF6F61]" />
            <div className="flex-1 font-medium">
              {errorMessage}
              {errorMessage.toLowerCase().includes('verify') && (
                <div className="mt-1.5">
                  <Link href={ROUTES.PUBLIC.VERIFY_EMAIL} className="underline font-semibold text-[#19D3E3] hover:text-[#5FE8F5]">
                    Go to email verification &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} action="#" method="POST" className="space-y-4" noValidate>
          <FormField
            id="login-email"
            label="Email address"
            required
            error={fieldErrors.email}
          >
            <Input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
              error={Boolean(fieldErrors.email)}
              icon={<Icon name="mail" className="w-4 h-4" />}
            />
          </FormField>

          <FormField
            id="login-password"
            label="Password"
            required
            error={fieldErrors.password}
          >
            <Input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              error={Boolean(fieldErrors.password)}
              icon={<Icon name="lock" className="w-4 h-4" />}
              action={
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 min-w-[24px] min-h-[24px] text-[#9BAAB4] hover:text-[#F4F8FA] focus:outline-none flex items-center justify-center transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="w-4 h-4" />
                </button>
              }
            />
          </FormField>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#9BAAB4]">
              <input
                id="login-remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                aria-label="Remember me on this device"
                className="w-4 h-4 rounded border-[#263640] bg-[#101A22] text-[#19D3E3] focus:ring-[#19D3E3] cursor-pointer"
              />
              <label htmlFor="login-remember-me" className="cursor-pointer select-none">
                Remember me
              </label>
            </div>

            <Link
              href={ROUTES.PUBLIC.FORGOT_PASSWORD}
              className="font-medium text-[#19D3E3] hover:text-[#5FE8F5] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2 shadow-md shadow-[#19D3E3]/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#080D12]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              isAdminMode ? 'Sign In as Administrator' : 'Sign In'
            )}
          </Button>

          <p className="text-[11px] text-center text-[#9BAAB4]">
            {isAdminMode ? 'Restricted to authorized Looply administrators' : 'Protected by end-to-end secure session authentication'}
          </p>
        </form>

        <div className="pt-4 border-t border-[#263640] text-center text-xs text-[#9BAAB4]">
          Don&apos;t have an account?{' '}
          <Link
            href={ROUTES.PUBLIC.REGISTER}
            className="font-semibold text-[#19D3E3] hover:text-[#5FE8F5] hover:underline"
          >
            Create an account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

