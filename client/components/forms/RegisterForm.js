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

      setSuccessMessage(result.message || 'Account created successfully! Redirecting to sign in...');
      setTimeout(() => {
        router.push(ROUTES.PUBLIC.LOGIN);
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

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

        {successMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs"
          >
            <Icon name="check" className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <div className="flex-1 font-medium">{successMessage}</div>
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
                  className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
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
                  className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
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
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="cursor-pointer select-none leading-relaxed">
                I agree to the Looply <span className="text-indigo-600 hover:underline">Terms of Service</span> and{' '}
                <span className="text-indigo-600 hover:underline">Privacy Policy</span>.
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

          <p className="text-[11px] text-center text-slate-400">
            Protected by end-to-end secure registration validation
          </p>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Already have an account?{' '}
          <Link
            href={ROUTES.PUBLIC.LOGIN}
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

