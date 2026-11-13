'use client';

import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import { ROUTES } from '@/lib/routes';

/**
 * Reusable Experience Header for Looply Experience Pages (Warm Social Playground Theme)
 * Standardizes:
 *  - Back navigation to /experiences
 *  - Category pill and active status badge
 *  - Experience title and descriptive purpose
 *  - Primary action CTA slot
 */
export default function ExperienceHeader({
  title,
  description,
  icon = 'experiences',
  categoryLabel = 'Experience',
  status = 'Active',
  statusVariant = 'primary',
  action = null,
  children = null
}) {
  const schemeMap = {
    primary: {
      bg: 'bg-[#EEEAFE]',
      text: 'text-[#6C63FF]',
      border: 'border-[#6C63FF]/30'
    },
    coral: {
      bg: 'bg-[#FFEAEA]',
      text: 'text-[#FF6B6B]',
      border: 'border-[#FF6B6B]/30'
    },
    yellow: {
      bg: 'bg-[#FFF7E0]',
      text: 'text-[#B28200]',
      border: 'border-[#FFD166]/40'
    },
    lime: {
      bg: 'bg-[#E8F7EE]',
      text: 'text-[#2E7D4E]',
      border: 'border-[#4CAF78]/30'
    },
    lavender: {
      bg: 'bg-[#EEEAFE]',
      text: 'text-[#6C63FF]',
      border: 'border-[#6C63FF]/30'
    }
  };

  const scheme = schemeMap[statusVariant] || schemeMap.primary;

  return (
    <header className="space-y-4">
      {/* Back to Experiences Hub Navigation */}
      <div>
        <Link
          href={ROUTES.USER.EXPERIENCES}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B73] hover:text-[#1E1E24] transition-colors group"
        >
          <Icon
            name="arrowLeft"
            className="w-3.5 h-3.5 text-[#6B6B73] group-hover:text-[#1E1E24] group-hover:-translate-x-1 transition-transform"
          />
          <span>Back to Experiences Hub</span>
        </Link>
      </div>

      {/* Main Experience Hero Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E5E0] shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border ${scheme.bg} ${scheme.border} ${scheme.text}`}
            >
              <Icon name={icon} className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant} size="sm">
                  {categoryLabel}
                </Badge>
                {status && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${scheme.bg} ${scheme.text} border ${scheme.border} font-display`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {status}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-[#1E1E24] font-display tracking-tight">
                {title}
              </h1>

              <p className="text-xs sm:text-sm text-[#6B6B73] max-w-2xl leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>

        {children && <div className="mt-4 pt-4 border-t border-[#E7E5E0]">{children}</div>}
      </div>
    </header>
  );
}
