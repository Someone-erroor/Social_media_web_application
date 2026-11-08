/**
 * Reusable Badge Component for Looply (Editorial Expression Theme)
 * Status pills and descriptive tags with Electric Coral, Acid Lime, and Soft Lavender accents.
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
    neutral: 'bg-[#24202E] text-[#F6F2EA] border border-[#2D2938]',
    primary: 'bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/35 font-semibold',
    coral: 'bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/35 font-semibold',
    lime: 'bg-[#D5F36A]/15 text-[#D5F36A] border border-[#D5F36A]/35 font-semibold',
    lavender: 'bg-[#B9A8F5]/15 text-[#B9A8F5] border border-[#B9A8F5]/35 font-semibold',
    success: 'bg-[#D5F36A]/15 text-[#D5F36A] border border-[#D5F36A]/35 font-semibold',
    warning: 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/35 font-medium',
    danger: 'bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/35 font-semibold',
    outline: 'bg-transparent text-[#777580] border border-[#2D2938]'
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
