import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

/**
 * Editorial Logo Brand Component for Looply
 * Modern Infinity Loop mark with Electric Coral (#FF6257) and Soft Lavender (#B9A8F5) gradient.
 * "Looply" wordmark with Warm Ivory (#F6F2EA) typography.
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
        className={`flex items-center justify-center rounded-2xl shadow-sm border border-[#2D2938] transition-all duration-300 group-hover:scale-105 group-hover:border-[#FF6257]/60 group-hover:shadow-lg group-hover:shadow-[#FF6257]/20 shrink-0 ${
          inverted ? 'bg-[#24202E] text-white' : 'bg-[#1E1B26]'
        } ${
          isLarge ? 'w-14 h-14' : isSmall ? 'w-8 h-8 rounded-xl' : 'w-10 h-10'
        }`}
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 group-hover:rotate-6 ${isLarge ? 'w-9 h-9' : isSmall ? 'w-5 h-5' : 'w-6 h-6'}`}
        >
          <defs>
            <linearGradient id="editorial-logo-grad" x1="8" y1="12" x2="56" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6257" />
              <stop offset="50%" stopColor="#B9A8F5" />
              <stop offset="100%" stopColor="#D5F36A" />
            </linearGradient>
          </defs>
          <path
            d="M20 22 C13 22 9 27 9 32 C9 37 13 42 20 42 C28 42 36 22 44 22 C51 22 55 27 55 32 C55 37 51 42 44 42 C36 42 28 22 20 22 Z"
            stroke="url(#editorial-logo-grad)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="32" r="3" fill="#FF6257" />
          <circle cx="44" cy="32" r="3" fill="#D5F36A" />
        </svg>
      </div>

      {/* Brand Wordmark and Tagline */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-black tracking-tight leading-none text-[#F6F2EA] font-display ${
              isLarge ? 'text-3xl' : isSmall ? 'text-lg' : 'text-xl'
            }`}
          >
            Loop<span className="text-[#FF6257]">ly</span>
          </span>
          {badgeText && (
            <span
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30"
            >
              {badgeText}
            </span>
          )}
        </div>
        {showTagline && (
          <span
            className={`font-semibold uppercase tracking-widest mt-1 text-[#777580] ${
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
        className="inline-flex focus:outline-none focus:ring-2 focus:ring-[#FF6257] rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
