import Icon from './Icon';

/**
 * Reusable Empty State Component for Looply (Warm Social Playground Theme)
 * Friendly, honest empty states with soft lavender and brand accents.
 */
export default function EmptyState({
  icon = 'feed',
  title,
  description,
  badgeText,
  action,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-[#E7E5E0] rounded-2xl bg-white shadow-xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#EEEAFE] border border-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF] mb-4 shadow-xs">
        <Icon name={icon} className="w-7 h-7" />
      </div>

      {badgeText && (
        <span className="inline-block text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20 mb-2.5">
          {badgeText}
        </span>
      )}

      <h3 className="text-base font-bold text-[#1E1E24] font-display tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-[#6B6B73] max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
