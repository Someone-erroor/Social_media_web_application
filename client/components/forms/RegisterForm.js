'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { ROUTES } from '@/lib/routes';

export default function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [registeredState, setRegisteredState] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    } else if (fullName.trim().length > 70) {
      errors.fullName = 'Full name cannot exceed 70 characters.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Password confirmation is required.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!agreeTerms) {
      errors.terms = 'You must agree to the Terms of Service to create an account.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
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
      const result = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword
      });

      const deliveryMode = result?.deliveryMode || 'smtp';
      let previewLink = null;
      if (deliveryMode === 'preview') {
        try {
          const devMail = await authService.getDevMailboxLatest();
          previewLink = devMail?.email?.link || null;
        } catch {
          // non-blocking
        }
      }

      setRegisteredState({
        deliveryMode,
        email: email.trim(),
        message: result?.message,
        previewLink
      });
    } catch (err) {
      if (err.isNetworkError || err.status === 0) {
        setErrorMessage('Unable to reach the backend server. Please verify the API server is running on http://localhost:5000.');
      } else if (err.status === 409) {
        setErrorMessage(err.message || 'An account with this email address already exists.');
      } else {
        setErrorMessage(err.message || 'Registration failed. Please review your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registeredState) {
    return (
      <Card className="shadow-md border-slate-200">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold">Account Registration</CardTitle>
          <CardDescription>
            {registeredState.deliveryMode === 'smtp'
              ? 'Complete email verification to activate your account'
              : 'Local development verification preview'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4" data-testid="registration-success-state">
          {registeredState.deliveryMode === 'smtp' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Icon name="mail" className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#172126]">
                  Verification email sent. Please check your inbox.
                </h3>
                <p className="text-xs text-[#68757C]">
                  We sent a secure verification link to <strong className="text-[#172126]">{registeredState.email}</strong>. Please check your inbox to activate your account.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  href={ROUTES.PUBLIC.VERIFY_EMAIL}
                  variant="primary"
                  size="md"
                  data-testid="continue-to-login-btn"
                  className="w-full sm:w-auto"
                >
                  Continue to Email Verification
                </Button>
              </div>
            </div>
          )}

          {registeredState.deliveryMode === 'preview' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-cyan-100 text-[#087F8A] flex items-center justify-center">
                <Icon name="mail" className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[#172126]">
                  Your verification email has been created in the local development mailbox.
                </h3>
                <p className="text-xs text-[#68757C] max-w-sm mx-auto leading-relaxed">
                  Real SMTP credentials are not configured in local development. Retrieve your verification link directly from the local development preview mailbox below:
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href="http://localhost:5000/api/__dev/mailbox/latest"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#087F8A] hover:bg-[#16B8C8] text-white font-medium text-xs shadow-xs transition-colors w-full sm:w-auto"
                >
                  <Icon name="mail" className="w-4 h-4" />
                  <span>Open Local Email Preview</span>
                </a>
                {registeredState.previewLink && (
                  <a
                    href={registeredState.previewLink}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#16B8C8] text-[#172126] hover:bg-[#087F8A] hover:text-white font-semibold text-xs shadow-xs transition-colors w-full sm:w-auto"
                  >
                    <span>Verify Account Now &rarr;</span>
                  </a>
                )}
              </div>
              <div className="pt-2">
                <Link
                  href={ROUTES.PUBLIC.LOGIN}
                  data-testid="continue-to-login-btn"
                  className="text-xs font-semibold text-[#087F8A] hover:underline inline-block"
                >
                  Continue to Sign In &rarr;
                </Link>
              </div>
            </div>
          )}

          {registeredState.deliveryMode === 'unavailable' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Icon name="alertCircle" className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#172126]">
                  Account created, but email delivery is currently unavailable.
                </h3>
                <p className="text-xs text-[#68757C]">
                  Please request a verification email later or contact the administrator to activate your account.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  href={ROUTES.PUBLIC.LOGIN}
                  variant="outline"
                  size="md"
                  data-testid="continue-to-login-btn"
                  className="w-full sm:w-auto"
                >
                  Go to Sign In
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-bold">Create your account</CardTitle>
        <CardDescription>
          Join Looply today to share ideas, discover creators, and build meaningful connections
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs"
          >
            <Icon name="alertCircle" className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            id="register-name"
            label="Full name"
            required
            error={fieldErrors.fullName}
          >
            <Input
              id="register-name"
              name="fullName"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: null }));
              }}
              placeholder="Alex Morgan"
              autoComplete="name"
              disabled={loading}
              error={Boolean(fieldErrors.fullName)}
              icon={<Icon name="profile" className="w-4 h-4" />}
            />
          </FormField>

          <FormField
            id="register-email"
            label="Email address"
            required
            error={fieldErrors.email}
          >
            <Input
              id="register-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="alex@example.com"
              autoComplete="email"
              disabled={loading}
              error={Boolean(fieldErrors.email)}
              icon={<Icon name="mail" className="w-4 h-4" />}
            />
          </FormField>

          <FormField
            id="register-password"
            label="Password"
            required
            helperText="Must be at least 8 characters"
            error={fieldErrors.password}
          >
            <Input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              error={Boolean(fieldErrors.password)}
              icon={<Icon name="lock" className="w-4 h-4" />}
              action={
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 min-w-[24px] min-h-[24px] text-slate-500 hover:text-slate-700 focus:outline-none flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="w-4 h-4" />
                </button>
              }
            />
          </FormField>

          <FormField
            id="register-confirm-password"
            label="Confirm password"
            required
            error={fieldErrors.confirmPassword}
          >
            <Input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
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
              action={
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="p-1 min-w-[24px] min-h-[24px] text-slate-500 hover:text-slate-700 focus:outline-none flex items-center justify-center"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} className="w-4 h-4" />
                </button>
              }
            />
          </FormField>

          <div>
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (fieldErrors.terms) setFieldErrors((prev) => ({ ...prev, terms: null }));
                }}
                disabled={loading}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#087F8A] focus:ring-[#16B8C8]"
              />
              <label htmlFor="terms" className="cursor-pointer select-none leading-relaxed">
                I agree to the Looply{' '}
                <Link href={ROUTES.PUBLIC.TERMS} target="_blank" className="text-[#087F8A] hover:underline font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href={ROUTES.PUBLIC.PRIVACY} target="_blank" className="text-[#087F8A] hover:underline font-medium">
                  Privacy Policy
                </Link>.
              </label>
            </div>
            {fieldErrors.terms && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{fieldErrors.terms}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
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
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </Button>

          <p className="text-[11px] text-center text-slate-600">
            Protected by end-to-end secure registration validation
          </p>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link
            href={ROUTES.PUBLIC.LOGIN}
            className="font-semibold text-[#087F8A] hover:text-[#087F8A] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

