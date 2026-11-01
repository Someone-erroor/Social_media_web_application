import { Suspense } from 'react';
import LoginForm from '@/components/forms/LoginForm';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your Looply account'
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-xs text-[#9BAAB4]">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
