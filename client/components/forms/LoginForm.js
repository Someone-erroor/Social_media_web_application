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
  const { login, registerAdmin } = useAuth();
  const searchParams = useSearchParams();
  const isAdminMode = searchParams ? searchParams.get('admin') === 'true' : false;
  const isVerifiedParam = searchParams ? searchParams.get('verified') === 'true' : false;
  const emailParam = searchParams ? searchParams.get('email') || '' : '';

  const [isCreateAdmin, setIsCreateAdmin] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
    if (isVerifiedParam) {
      setSuccessMessage('Your email has been verified successfully! You can now sign in.');
    }
  }, [emailParam, isVerifiedParam]);

  const validateForm = () => {
    const errors = {};

    if (isCreateAdmin && (!fullName.trim() || fullName.trim().length < 2)) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (isCreateAdmin && password.length < 8) {
      errors.password = 'Admin password must be at least 8 characters.';
    }

    if (isCreateAdmin && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@looply.com');
    setPassword('Password@123');
    setFieldErrors({});
    setErrorMessage('');
    setIsCreateAdmin(false);
  };

  const handleFillDemoUser = () => {
    setEmail('demo@looply.com');
    setPassword('Password@123');
    setFieldErrors({});
    setErrorMessage('');
    setIsCreateAdmin(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isCreateAdmin) {
        await registerAdmin({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          confirmPassword
        });
      } else {
        await login({
          email: email.trim(),
          password,
          isAdminMode
        });
      }
    } catch (err) {
      if (err.isNetworkError || err.status === 0) {
        setErrorMessage('Unable to reach the backend server. Please verify the API server is running on http://localhost:5000.');
      } else if (err.status === 401) {
        setErrorMessage(err.message || 'Invalid email or password. Please verify your credentials.');
      } else if (err.status === 403) {
        setErrorMessage(err.message || 'Access restricted. Please use valid administrator credentials.');
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
    <Card className="shadow-xs border-[#E7E5E0] bg-white">
      <CardHeader className="text-center pb-2">
        {isAdminMode ? (
          <div className="flex flex-col items-center gap-1.5 pb-1">
            <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20 flex items-center justify-center mb-1 shadow-xs">
              <Icon name="shield" className="w-6 h-6 text-[#6C63FF]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C63FF] bg-[#EEEAFE] border border-[#6C63FF]/20 px-2 py-0.5 rounded">
              Administrator Portal
            </span>
            <CardTitle className="text-xl font-bold text-[#1E1E24]">
              {isCreateAdmin ? 'Create Administrator' : 'Admin Sign In'}
            </CardTitle>
            <CardDescription className="text-xs text-[#6B6B73]">
              {isCreateAdmin
                ? 'Create a new administrator ID & password for immediate platform control'
                : 'Enter administrator ID and password to access platform controls'}
            </CardDescription>
          </div>
        ) : (
          <div className="text-center pb-1">
            <CardTitle className="text-xl font-bold text-[#1E1E24]">Welcome back</CardTitle>
            <CardDescription className="text-xs text-[#6B6B73]">
              Enter your credentials to access your Looply social feed
            </CardDescription>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Demo Quick-Fill Helper Banner */}
        {!isCreateAdmin && (
          <div className="p-3.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#6C63FF] flex items-center gap-1.5">
                <Icon name="sparkles" className="w-3.5 h-3.5 shrink-0" />
                Demo Credentials (Pre-Verified)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFillDemoUser}
                  className="text-[10px] font-bold text-white bg-[#6C63FF] hover:bg-[#574FE8] px-2.5 py-1 rounded-md transition-all cursor-pointer shadow-xs"
                >
                  Fill User
                </button>
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-[10px] font-bold text-[#6C63FF] bg-[#EEEAFE] border border-[#6C63FF]/30 hover:bg-[#EEEAFE]/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                >
                  Fill Admin
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-[#6B6B73]">
              <div>User: <span className="text-[#1E1E24] font-semibold">demo@looply.com</span></div>
              <div>Admin: <span className="text-[#1E1E24] font-semibold">admin@looply.com</span></div>
              <div className="sm:col-span-2 text-[10px] text-[#6B6B73]">
                Password: <span className="text-[#1E1E24] font-semibold">Password@123</span>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs font-medium"
          >
            <Icon name="alertCircle" className="w-4 h-4 shrink-0 mt-0.5 text-[#FF6B6B]" />
            <div className="flex-1">
              {errorMessage}
              {errorMessage.toLowerCase().includes('verify') && (
                <div className="mt-1.5">
                  <Link href={ROUTES.PUBLIC.VERIFY_EMAIL} className="underline font-semibold text-[#FF6B6B] hover:opacity-80">
                    Go to email verification &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-[#E8F7EE] border border-[#4CAF78]/30 text-xs text-[#2E7D4E] flex items-center gap-2 font-medium">
            <Icon name="check" className="w-4 h-4 text-[#2E7D4E] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} action="#" method="POST" className="space-y-4" noValidate>
          {/* Full Name field (Create Admin Mode only) */}
          {isCreateAdmin && (
            <FormField
              id="admin-fullname"
              label="Administrator Full Name"
              required
              error={fieldErrors.fullName}
            >
              <Input
                id="admin-fullname"
                name="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: null }));
                }}
                placeholder="e.g. Master Admin"
                disabled={loading}
                error={Boolean(fieldErrors.fullName)}
                icon={<Icon name="profile" className="w-4 h-4" />}
              />
            </FormField>
          )}

          <FormField
            id="login-email"
            label={isCreateAdmin ? 'Administrator ID / Email' : 'Email address'}
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
            label={isCreateAdmin ? 'Administrator Password (min 8 chars)' : 'Password'}
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
              autoComplete={isCreateAdmin ? 'new-password' : 'current-password'}
              disabled={loading}
              error={Boolean(fieldErrors.password)}
              icon={<Icon name="lock" className="w-4 h-4" />}
              action={
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 min-w-[24px] min-h-[24px] text-[#6B6B73] hover:text-[#1E1E24] focus:outline-none flex items-center justify-center transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="w-4 h-4" />
                </button>
              }
            />
          </FormField>

          {/* Confirm Password (Create Admin Mode only) */}
          {isCreateAdmin && (
            <FormField
              id="admin-confirm-password"
              label="Confirm Password"
              required
              error={fieldErrors.confirmPassword}
            >
              <Input
                id="admin-confirm-password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={loading}
                error={Boolean(fieldErrors.confirmPassword)}
                icon={<Icon name="lock" className="w-4 h-4" />}
              />
            </FormField>
          )}

          {!isCreateAdmin && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#6B6B73]">
                <input
                  id="login-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  aria-label="Remember me on this device"
                  className="w-4 h-4 rounded border-[#E7E5E0] text-[#6C63FF] focus:ring-[#6C63FF] cursor-pointer"
                />
                <label htmlFor="login-remember-me" className="cursor-pointer select-none font-medium">
                  Remember me
                </label>
              </div>

              <Link
                href={ROUTES.PUBLIC.FORGOT_PASSWORD}
                className="font-semibold text-[#6C63FF] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2 shadow-xs"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                <span>{isCreateAdmin ? 'Creating Administrator...' : 'Signing in...'}</span>
              </>
            ) : isCreateAdmin ? (
              'Create & Enter Admin Console'
            ) : isAdminMode ? (
              'Sign In as Administrator'
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Mode switch for Admin Mode */}
          {isAdminMode ? (
            <div className="pt-2 text-center text-xs">
              {isCreateAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAdmin(false);
                    setErrorMessage('');
                    setFieldErrors({});
                  }}
                  className="text-[#6C63FF] hover:underline font-semibold cursor-pointer"
                >
                  &larr; Already have an Admin account? Sign In
                </button>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-[#6B6B73]">
                    Need a new administrator login?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateAdmin(true);
                      setErrorMessage('');
                      setFieldErrors({});
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6C63FF] bg-[#EEEAFE] border border-[#6C63FF]/30 hover:bg-[#EEEAFE]/80 transition-all cursor-pointer"
                  >
                    <Icon name="shield" className="w-3.5 h-3.5" />
                    <span>Create New Administrator ID &amp; Password</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-center text-[#6B6B73]">
              Protected by secure session authentication and bcrypt password hashing
            </p>
          )}
        </form>

        <div className="pt-4 border-t border-[#E7E5E0] text-center text-xs text-[#6B6B73]">
          {isAdminMode ? (
            <Link
              href={ROUTES.PUBLIC.LOGIN}
              className="font-medium text-[#6B6B73] hover:text-[#1E1E24] hover:underline"
            >
              &larr; Return to Standard User Login
            </Link>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link
                href={ROUTES.PUBLIC.REGISTER}
                className="font-semibold text-[#6C63FF] hover:underline"
              >
                Create an account
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
