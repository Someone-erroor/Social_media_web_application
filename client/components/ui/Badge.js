/**
 * Reusable Badge Component for Looply (Dark Neon Theme)
 * Status pills and descriptive tags with dark neon accents.
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
    neutral: 'bg-[#1D2A35] text-[#F4F8FA] border border-[#263640]',
    primary: 'bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/35 font-semibold',
    coral: 'bg-[#FF6F61]/15 text-[#FF6F61] border border-[#FF6F61]/35 font-semibold',
    success: 'bg-[#32D583]/15 text-[#32D583] border border-[#32D583]/35 font-medium',
    warning: 'bg-[#F5B942]/15 text-[#F5B942] border border-[#F5B942]/35 font-medium',
    danger: 'bg-[#FF5C70]/15 text-[#FF5C70] border border-[#FF5C70]/35 font-semibold',
    outline: 'bg-transparent text-[#9BAAB4] border border-[#263640]'
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
