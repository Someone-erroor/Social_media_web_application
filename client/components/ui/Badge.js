/**
 * Reusable Badge Component for Looply
 * Status pills and descriptive tags
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
    neutral: 'bg-[#F6F8F7] text-[#252E34] border border-[#E3E8E8]',
    primary: 'bg-cyan-50 text-[#087F8A] border border-cyan-200 font-semibold',
    coral: 'bg-[#FF725E]/15 text-[#D94A38] border border-[#FF725E]/30 font-semibold',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    outline: 'bg-transparent text-[#252E34] border border-[#E3E8E8]'
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

