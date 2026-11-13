/**
 * Reusable Badge Component for Looply (Warm Social Playground Theme)
 * Status pills and descriptive tags with Brand Purple, Social Coral, Joy Yellow, and Success Green.
 */
export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center font-medium rounded-full select-none';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  };

  const variantClasses = {
    neutral: 'bg-[#F1F0EC] text-[#1E1E24] border border-[#E7E5E0]',
    primary: 'bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/25 font-semibold',
    coral: 'bg-[#FFEAEA] text-[#FF6B6B] border border-[#FF6B6B]/25 font-semibold',
    lime: 'bg-[#E8F7EE] text-[#2E7D4E] border border-[#4CAF78]/30 font-semibold',
    lavender: 'bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/25 font-semibold',
    success: 'bg-[#E8F7EE] text-[#2E7D4E] border border-[#4CAF78]/30 font-semibold',
    warning: 'bg-[#FFF7E0] text-[#B28200] border border-[#FFD166]/40 font-semibold',
    danger: 'bg-[#FFEAEA] text-[#FF6B6B] border border-[#FF6B6B]/25 font-semibold',
    yellow: 'bg-[#FFF7E0] text-[#B28200] border border-[#FFD166]/40 font-semibold',
    outline: 'bg-white text-[#6B6B73] border border-[#E7E5E0]'
  };

  return (
    <span
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.neutral
      } ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
