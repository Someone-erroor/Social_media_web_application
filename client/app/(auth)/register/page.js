import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Create Account',
  description: 'Join Looply to connect, share, and express'
};

export default function RegisterPage() {
  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-bold">Create your account</CardTitle>
        <CardDescription>
          Join Looply today to share ideas, discover creators, and build meaningful connections
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <form className="space-y-4">
          <FormField id="register-name" label="Full name" required>
            <Input
              id="register-name"
              type="text"
              placeholder="Alex Morgan"
              autoComplete="name"
              icon={<Icon name="profile" className="w-4 h-4" />}
            />
          </FormField>

          <FormField id="register-email" label="Email address" required>
            <Input
              id="register-email"
              type="email"
              placeholder="alex@example.com"
              autoComplete="email"
              icon={<Icon name="mail" className="w-4 h-4" />}
            />
          </FormField>

          <FormField id="register-password" label="Password" required helperText="Must be at least 8 characters">
            <Input
              id="register-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              icon={<Icon name="lock" className="w-4 h-4" />}
            />
          </FormField>

          <FormField id="register-confirm-password" label="Confirm password" required>
            <Input
              id="register-confirm-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              icon={<Icon name="lock" className="w-4 h-4" />}
            />
          </FormField>

          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <input
              id="terms"
              type="checkbox"
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="terms" className="cursor-pointer select-none leading-relaxed">
              I agree to the Looply <span className="text-indigo-600 hover:underline">Terms of Service</span> and{' '}
              <span className="text-indigo-600 hover:underline">Privacy Policy</span>.
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled
          >
            Create Account
          </Button>

          <p className="text-[11px] text-center text-slate-400">
            Member registration portal &bull; Coming Soon
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
