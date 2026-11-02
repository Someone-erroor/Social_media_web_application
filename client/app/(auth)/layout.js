import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { ROUTES } from '@/lib/routes';

/**
 * Authentication Route Group Layout (Dark Neon Theme)
 * Provides a clean, focused, accessible dark shell for auth pages.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-[#080D12] text-[#F4F8FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-[#19D3E3]/12 via-[#FF6F61]/8 to-transparent blur-3xl rounded-full pointer-events-none animate-glow-pulse" />

      {/* Brand Header */}
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex justify-center mb-2">
          <Logo size="large" showTagline={true} href={ROUTES.PUBLIC.HOME} />
        </div>
      </div>

      {/* Main Form Container */}
      <main className="relative sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        {children}
      </main>

      {/* Auth Shell Footer */}
      <div className="relative mt-8 text-center text-xs text-[#9BAAB4]">
        <p>Looply &bull; Connect. Share. Express.</p>
        <p className="mt-1">
          <Link href={ROUTES.PUBLIC.HOME} className="text-[#19D3E3] hover:underline font-medium">
            &larr; Return to Public Homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
