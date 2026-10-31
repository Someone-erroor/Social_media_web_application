import Icon from './Icon';

/**
 * Reusable Empty State Component for Looply
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
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/60 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
        <Icon name={icon} className="w-6 h-6" />
      </div>

      {badgeText && (
        <span className="inline-block text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 mb-2">
          {badgeText}
        </span>
      )}

      <h3 className="text-base font-semibold text-slate-800 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

