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
    setEmail('admin@looply.social');
    setPassword('Admin@1234');
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
            <CardTitle className="text-xl font-bold text-[#F4F8FA]">
              {isCreateAdmin ? 'Create Administrator' : 'Admin Sign In'}
            </CardTitle>
            <CardDescription className="text-xs text-[#9BAAB4]">
              {isCreateAdmin
                ? 'Create a new administrator ID & password for immediate platform control'
                : 'Enter administrator ID and password to access platform controls'}
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
        {/* Demo Admin Quick-Fill Banner (Visible in Admin Mode) */}
        {isAdminMode && !isCreateAdmin && (
          <div className="p-3 rounded-xl bg-[#101A22] border border-[#19D3E3]/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#19D3E3] flex items-center gap-1.5">
                <Icon name="shield" className="w-3.5 h-3.5 shrink-0" />
                Demo Admin Credentials
              </span>
              <button
                type="button"
                onClick={handleFillDemoAdmin}
                className="text-[11px] font-bold text-[#080D12] bg-[#19D3E3] hover:bg-[#00B8C8] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Auto-Fill Demo
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-[#9BAAB4]">
              <div>Email: <span className="text-[#F4F8FA] font-semibold">admin@looply.social</span></div>
              <div>Password: <span className="text-[#F4F8FA] font-semibold">Admin@1234</span></div>
            </div>
          </div>
        )}

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

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <Icon name="check" className="w-4 h-4 text-emerald-400 shrink-0" />
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
                  className="p-1 min-w-[24px] min-h-[24px] text-[#9BAAB4] hover:text-[#F4F8FA] focus:outline-none flex items-center justify-center transition-colors"
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
          )}

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
                  className="text-[#19D3E3] hover:underline font-semibold cursor-pointer"
                >
                  &larr; Already have an Admin account? Sign In
                </button>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-[#9BAAB4]">
                    Need a new administrator login?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateAdmin(true);
                      setErrorMessage('');
                      setFieldErrors({});
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#19D3E3] bg-[#101A22] border border-[#19D3E3]/40 hover:bg-[#151F29] transition-all cursor-pointer"
                  >
                    <Icon name="shield" className="w-3.5 h-3.5" />
                    <span>Create New Administrator ID &amp; Password</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-center text-[#9BAAB4]">
              Protected by end-to-end secure session authentication
            </p>
          )}
        </form>

        <div className="pt-4 border-t border-[#263640] text-center text-xs text-[#9BAAB4]">
          {isAdminMode ? (
            <Link
              href={ROUTES.PUBLIC.LOGIN}
              className="font-medium text-[#9BAAB4] hover:text-[#F4F8FA] hover:underline"
            >
              &larr; Return to Standard User Login
            </Link>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link
                href={ROUTES.PUBLIC.REGISTER}
                className="font-semibold text-[#19D3E3] hover:text-[#5FE8F5] hover:underline"
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

