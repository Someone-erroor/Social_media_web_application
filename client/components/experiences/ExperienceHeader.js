'use client';

import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import { ROUTES } from '@/lib/routes';

/**
 * Reusable Experience Header for Looply Experience Pages
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
  statusVariant = 'coral',
  action = null,
  children = null
}) {
  const schemeMap = {
    coral: {
      bg: 'bg-[#FF6257]/15',
      text: 'text-[#FF6257]',
      border: 'border-[#FF6257]/30',
      glow: 'shadow-[0_0_35px_-12px_rgba(255,98,87,0.25)]'
    },
    lavender: {
      bg: 'bg-[#B9A8F5]/15',
      text: 'text-[#B9A8F5]',
      border: 'border-[#B9A8F5]/30',
      glow: 'shadow-[0_0_35px_-12px_rgba(185,168,245,0.25)]'
    },
    lime: {
      bg: 'bg-[#D5F36A]/15',
      text: 'text-[#D5F36A]',
      border: 'border-[#D5F36A]/30',
      glow: 'shadow-[0_0_35px_-12px_rgba(213,243,106,0.25)]'
    },
    amber: {
      bg: 'bg-[#FBBF24]/15',
      text: 'text-[#FBBF24]',
      border: 'border-[#FBBF24]/30',
      glow: 'shadow-[0_0_35px_-12px_rgba(251,191,36,0.25)]'
    }
  };

  const scheme = schemeMap[statusVariant] || schemeMap.coral;

  return (
    <header className="space-y-4">
      {/* Back to Experiences Hub Navigation */}
      <div>
        <Link
          href={ROUTES.USER.EXPERIENCES}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#777580] hover:text-[#F6F2EA] transition-colors group"
        >
          <Icon
            name="arrowLeft"
            className="w-3.5 h-3.5 text-[#777580] group-hover:text-[#F6F2EA] group-hover:-translate-x-1 transition-transform"
          />
          <span>Back to Experiences Hub</span>
        </Link>
      </div>

      {/* Main Experience Hero Card */}
      <div className={`p-5 sm:p-7 rounded-2xl bg-[#1E1B26] border border-[#2D2938] ${scheme.glow} transition-all`}>
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

              <h1 className="text-xl sm:text-2xl font-black text-[#F6F2EA] font-display tracking-tight">
                {title}
              </h1>

              <p className="text-xs sm:text-sm text-[#777580] max-w-2xl leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {action && (
            <div className="shrink-0 self-start lg:self-center">
              {action}
            </div>
          )}
        </div>

        {children && (
          <div className="mt-5 pt-5 border-t border-[#2D2938]">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

