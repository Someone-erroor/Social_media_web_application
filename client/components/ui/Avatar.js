import Icon from './Icon';

/**
 * Reusable Avatar Component for Looply (Warm Social Playground Theme)
 * Friendly avatar with initials or profile silhouette,
 * featuring Success Green (#4CAF78) active presence rings.
 */
export default function Avatar({
  name = 'User',
  src,
  size = 'md',
  className = '',
  status
}) {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-20 h-20 text-xl font-extrabold'
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
        className={`flex items-center justify-center rounded-full bg-[#EEEAFE] text-[#6C63FF] font-semibold select-none border border-[#E7E5E0] shadow-xs overflow-hidden ${
          sizeMap[size] || sizeMap.md
        } ${className}`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : initials ? (
          initials
        ) : (
          <Icon name="profile" className="w-1/2 h-1/2 text-[#6B6B73]" />
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white transition-colors duration-300 ${
            status === 'online' ? 'bg-[#4CAF78] shadow-xs' : 'bg-[#6B6B73]'
          } ${size === 'lg' || size === 'xl' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'}`}
        />
      )}
    </div>
  );
}
