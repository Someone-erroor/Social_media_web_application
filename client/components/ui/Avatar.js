import Icon from './Icon';

/**
 * Reusable Avatar Component for Looply
 * Neutral fallback avatar with initials or silhouette icon.
 */
export default function Avatar({
  name = 'User',
  size = 'md',
  className = '',
  status
}) {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl font-bold'
  };

  const getInitials = (text) => {
    if (!text) return 'U';
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div className="relative inline-flex shrink-0" aria-hidden="true">
      <div
        className={`flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold select-none border border-white shadow-xs ${
          sizeMap[size] || sizeMap.md
        } ${className}`}
      >
        {initials ? initials : <Icon name="profile" className="w-1/2 h-1/2 text-slate-400" />}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white ${
            status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
          } ${size === 'lg' || size === 'xl' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'}`}
        />
      )}
    </div>
  );
}

