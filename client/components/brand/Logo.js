import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

/**
 * Modular Logo Brand Component for Looply
 * Renders the unique Looply mark and brand typography.
 * Supports public, user, and admin colorways.
 */
export default function Logo({
  showTagline = true,
  size = 'default',
  href = ROUTES.PUBLIC.HOME,
  inverted = false,
  badgeText,
  onClick
}) {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const content = (
    <div className="flex items-center gap-3 select-none group">
      {/* Brand Mark Icon */}
      <div
        className={`flex items-center justify-center rounded-2xl shadow-sm transition-transform group-hover:scale-105 shrink-0 ${
          inverted ? 'bg-[#087F8A] text-white' : 'bg-[#172126]'
        } ${
          isLarge ? 'w-14 h-14' : isSmall ? 'w-8 h-8 rounded-xl' : 'w-10 h-10'
        }`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={isLarge ? 'w-9 h-9' : isSmall ? 'w-5 h-5' : 'w-6 h-6'}
        >
          <defs>
            <linearGradient id="logo-grad" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#16B8C8" />
              <stop offset="60%" stopColor="#087F8A" />
              <stop offset="100%" stopColor="#FF725E" />
            </linearGradient>
          </defs>
          <path
            d="M20 22 C13 22 9 27 9 32 C9 37 13 42 20 42 C28 42 36 22 44 22 C51 22 55 27 55 32 C55 37 51 42 44 42 C36 42 28 22 20 22 Z"
            stroke="url(#logo-grad)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="32" r="3" fill="#16B8C8" />
          <circle cx="44" cy="32" r="3" fill="#FF725E" />
        </svg>
      </div>

      {/* Brand Wordmark and Tagline */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-tight leading-none ${
              inverted ? 'text-white' : 'text-slate-900'
            } ${
              isLarge ? 'text-3xl' : isSmall ? 'text-lg' : 'text-xl'
            }`}
          >
            Loop<span className={inverted ? 'text-[#16B8C8]' : 'text-[#087F8A]'}>ly</span>
          </span>
          {badgeText && (
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                inverted
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'bg-cyan-50 text-[#087F8A] border border-cyan-200'
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>
        {showTagline && (
          <span
            className={`font-semibold uppercase tracking-wider mt-1 ${
              inverted ? 'text-slate-400' : 'text-slate-500'
            } ${
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
      <Link
        href={href}
        onClick={onClick}
        className="inline-flex focus:outline-none focus:ring-2 focus:ring-[#16B8C8] rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
