import Icon from './Icon';

/**
 * Reusable Empty State Component for Looply (Dark Neon Theme)
 * Communicates authentic empty states honestly without fabricated mock data.
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
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-[#263640] rounded-2xl bg-[#151F29] shadow-md shadow-black/20 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#1D2A35] border border-[#263640] flex items-center justify-center text-[#19D3E3] mb-4 shadow-sm">
        <Icon name={icon} className="w-6 h-6" />
      </div>

      {badgeText && (
        <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-[#1D2A35] text-[#19D3E3] border border-[#19D3E3]/30 mb-2">
          {badgeText}
        </span>
      )}

      <h3 className="text-base font-semibold text-[#F4F8FA] tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-[#9BAAB4] max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
