import Icon from './Icon';

/**
 * Reusable Empty State Component for Looply (Editorial Expression Theme)
 * Communicates authentic empty states honestly with Electric Coral and Soft Lavender accents.
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
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-[#2D2938] rounded-2xl bg-[#1E1B26] shadow-xl shadow-black/30 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#24202E] border border-[#2D2938] flex items-center justify-center text-[#FF6257] mb-4 shadow-sm">
        <Icon name={icon} className="w-7 h-7" />
      </div>

      {badgeText && (
        <span className="inline-block text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30 mb-2.5">
          {badgeText}
        </span>
      )}

      <h3 className="text-base font-bold text-[#F6F2EA] font-display tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-[#777580] max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
