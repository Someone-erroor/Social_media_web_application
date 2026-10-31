import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { ROUTES } from '@/lib/routes';

/**
 * Authentication Route Group Layout
 * Provides a clean, focused, accessible shell for auth pages.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex justify-center mb-2">
          <Logo size="large" showTagline={true} href={ROUTES.PUBLIC.HOME} />
        </div>
      </div>

      {/* Main Form Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {children}
      </div>

      {/* Auth Shell Footer */}
      <div className="mt-8 text-center text-xs text-slate-400">
        <p>Looply &bull; Connect. Share. Express.</p>
        <p className="mt-1">
          <Link href={ROUTES.PUBLIC.HOME} className="text-indigo-600 hover:underline">
            &larr; Return to Public Homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
