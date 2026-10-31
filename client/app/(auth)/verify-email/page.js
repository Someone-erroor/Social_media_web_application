import Link from 'next/link';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Verify Email',
  description: 'Verify your Looply email address'
};

export default function VerifyEmailPage() {
  return (
    <Card className="shadow-md border-slate-200 text-center">
      <CardHeader className="items-center pb-2">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2 shadow-xs">
          <Icon name="mail" className="w-7 h-7" />
        </div>
        <CardTitle className="text-xl font-bold">Check your email</CardTitle>
        <CardDescription className="max-w-xs mx-auto">
          We&apos;ve sent a verification link to your registered email address.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-3">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 text-left space-y-2">
          <p className="font-semibold text-slate-800">Verification Steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-500">
            <li>Open the confirmation email in your inbox.</li>
            <li>Click the secure 6-digit or direct verification link.</li>
            <li>Return to Looply and sign in to access your feed.</li>
          </ol>
        </div>

        <div className="space-y-2.5">
          <Button
            href={ROUTES.PUBLIC.LOGIN}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Continue to Sign In
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full"
            disabled
          >
            Resend Email (Activates in Phase 5)
          </Button>
        </div>

        <p className="text-[11px] text-slate-400">
          Didn&apos;t receive an email? Check your spam folder or verify your address.
        </p>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-600">
          Need to change your email?{' '}
          <Link
            href={ROUTES.PUBLIC.REGISTER}
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Register again
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

