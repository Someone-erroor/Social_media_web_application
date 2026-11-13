import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

/**
 * Modern Brand Logo for Looply
 * Infinity loop mark with Brand Primary (#6C63FF), Social Coral (#FF6B6B), and Joy Yellow (#FFD166) gradient.
 * "Looply" wordmark with High-Contrast Slate (#1E1E24) typography.
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
    <div className="flex items-center gap-3 select-none group cursor-pointer">
      {/* Brand Mark Icon */}
      <div
        className={`flex items-center justify-center rounded-2xl shadow-sm border border-[#E7E5E0] transition-all duration-300 group-hover:scale-105 group-hover:border-[#6C63FF]/40 group-hover:shadow-md group-hover:shadow-[#6C63FF]/15 shrink-0 ${
          inverted ? 'bg-[#1E1E24] text-white border-transparent' : 'bg-white'
        } ${
          isLarge ? 'w-13 h-13' : isSmall ? 'w-8 h-8 rounded-xl' : 'w-10 h-10'
        }`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 group-hover:rotate-6 ${isLarge ? 'w-8 h-8' : isSmall ? 'w-5 h-5' : 'w-6 h-6'}`}
        >
          <defs>
            <linearGradient id="looply-logo-grad" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6C63FF" />
              <stop offset="50%" stopColor="#FF6B6B" />
              <stop offset="100%" stopColor="#FFD166" />
            </linearGradient>
          </defs>
          <path
            d="M20 22 C13 22 9 27 9 32 C9 37 13 42 20 42 C28 42 36 22 44 22 C51 22 55 27 55 32 C55 37 51 42 44 42 C36 42 28 22 20 22 Z"
            stroke="url(#looply-logo-grad)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="32" r="3" fill="#6C63FF" />
          <circle cx="44" cy="32" r="3" fill="#FF6B6B" />
        </svg>
      </div>

      {/* Brand Wordmark and Tagline */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-tight leading-none text-[#1E1E24] font-display ${
              isLarge ? 'text-2xl sm:text-3xl' : isSmall ? 'text-lg' : 'text-xl'
            }`}
          >
            Loop<span className="text-[#6C63FF]">ly</span>
          </span>
          {badgeText && (
            <span
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20"
            >
              {badgeText}
            </span>
          )}
        </div>
        {showTagline && (
          <span
            className={`font-semibold uppercase tracking-wider mt-1 text-[#6B6B73] ${
              isLarge ? 'text-xs' : 'text-[10px]'
            }`}
          >
            Social Playground
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
        className="inline-flex focus:outline-none focus:ring-2 focus:ring-[#6C63FF] rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
