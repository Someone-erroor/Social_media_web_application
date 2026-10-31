import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your Looply account'
};

export default function LoginPage() {
  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your Looply social feed
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <form className="space-y-4">
          <FormField id="login-email" label="Email address" required>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              icon={<Icon name="mail" className="w-4 h-4" />}
            />
          </FormField>

          <FormField id="login-password" label="Password" required>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              icon={<Icon name="lock" className="w-4 h-4" />}
            />
          </FormField>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remember me</span>
            </label>

            <Link
              href={ROUTES.PUBLIC.FORGOT_PASSWORD}
              className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled
          >
            Sign In
          </Button>

          <p className="text-[11px] text-center text-slate-400">
            Secure authentication portal &bull; Coming Soon
          </p>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            href={ROUTES.PUBLIC.REGISTER}
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Create an account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
