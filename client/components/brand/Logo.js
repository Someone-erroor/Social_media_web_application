import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

/**
 * Modular Logo Brand Component
 * Renders the unique Looply icon and brand typography
 */
export default function Logo({ showTagline = true, size = 'default', href = ROUTES.PUBLIC.HOME }) {
  const isLarge = size === 'large';

  const content = (
    <div className="flex items-center gap-3 select-none group">
      {/* Brand Mark Icon */}
      <div
        className={`flex items-center justify-center bg-slate-900 rounded-2xl shadow-sm transition-transform group-hover:scale-105 ${
          isLarge ? 'w-14 h-14' : 'w-10 h-10'
        }`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={isLarge ? 'w-9 h-9' : 'w-6 h-6'}
        >
          <defs>
            <linearGradient id="logo-grad" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
          </defs>
          <path
            d="M20 22 C13 22 9 27 9 32 C9 37 13 42 20 42 C28 42 36 22 44 22 C51 22 55 27 55 32 C55 37 51 42 44 42 C36 42 28 22 20 22 Z"
            stroke="url(#logo-grad)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="32" r="3" fill="#818CF8" />
          <circle cx="44" cy="32" r="3" fill="#F472B6" />
        </svg>
      </div>

      {/* Brand Wordmark and Tagline */}
      <div className="flex flex-col">
        <span
          className={`font-black tracking-tight text-slate-900 dark:text-white leading-none ${
            isLarge ? 'text-3xl' : 'text-xl'
          }`}
        >
          Loop<span className="text-indigo-600 dark:text-indigo-400">ly</span>
        </span>
        {showTagline && (
          <span
            className={`font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider mt-1 ${
              isLarge ? 'text-xs' : 'text-[10px]'
            }`}
          >
            Connect. Share. Express.
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
