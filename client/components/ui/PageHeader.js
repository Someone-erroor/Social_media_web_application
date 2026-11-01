/**
 * Reusable PageHeader Component for Looply (Dark Neon Theme)
 * High-contrast header across user and admin screens
 */
export default function PageHeader({
  title,
  description,
  badge,
  action,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[#263640] mb-6 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F8FA]">
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {description && (
          <p className="mt-1 text-xs sm:text-sm text-[#9BAAB4] leading-normal">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

