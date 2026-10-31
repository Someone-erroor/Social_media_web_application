import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Set New Password',
  description: 'Set a new password for your Looply account'
};

export default function ResetPasswordPage() {
  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="text-center pb-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-2 shadow-xs">
          <Icon name="lock" className="w-6 h-6" />
        </div>
        <CardTitle className="text-xl font-bold">Set new password</CardTitle>
        <CardDescription>
          Your new password must be different from previously used passwords.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <form className="space-y-4">
          <FormField
            id="reset-password"
            label="New password"
            required
            helperText="Minimum 8 characters with at least one number or symbol"
          >
            <Input
              id="reset-password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              icon={<Icon name="lock" className="w-4 h-4" />}
            />
          </FormField>

          <FormField
            id="reset-confirm"
            label="Confirm new password"
            required
          >
            <Input
              id="reset-confirm"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              icon={<Icon name="lock" className="w-4 h-4" />}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled
          >
            Update Password
          </Button>

          <p className="text-[11px] text-center text-slate-400">
            Password update portal &bull; Coming Soon
          </p>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          Already know your credentials?{' '}
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
