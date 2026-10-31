import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Forgot Password',
  description: 'Request a password reset link for Looply'
};

export default function ForgotPasswordPage() {
  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-2 shadow-xs">
          <Icon name="lock" className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-bold">Reset your password</CardTitle>
        <CardDescription>
          Enter the email associated with your account and we&apos;ll send instructions to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <form className="space-y-4">
          <FormField id="forgot-email" label="Email address" required>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              icon={<Icon name="mail" className="w-4 h-4" />}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled
          >
            Send Reset Instructions
          </Button>

          <p className="text-[11px] text-center text-slate-400">
            Phase 2 UI Interface • Password recovery workflow activates in Phase 5
          </p>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Remember your password?{' '}
          <Link
            href={ROUTES.PUBLIC.LOGIN}
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
