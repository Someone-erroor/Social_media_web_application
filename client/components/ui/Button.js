import Link from 'next/link';

/**
 * Reusable Button Component for Looply (Editorial Expression)
 * Uses Electric Coral primary action, Warm Ivory typography, Midnight Ink surfaces,
 * Acid Lime highlights, and Soft Lavender accents with accessible focus and spring transitions.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  href,
  icon,
  className = '',
  onClick,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#110F17] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 select-none rounded-xl cursor-pointer tracking-tight';

  const sizeClasses = {
    xs: 'text-[11px] px-2.5 py-1 gap-1 rounded-lg',
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4.5 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5 rounded-2xl'
  };

  const variantClasses = {
    primary:
      'bg-[#FF6257] text-[#17151D] font-bold hover:bg-[#FF4D40] hover:shadow-lg hover:shadow-[#FF6257]/25 active:bg-[#e0382d] focus:ring-[#FF6257] shadow-sm border border-transparent',
    secondary:
      'bg-[#1E1B26] text-[#F6F2EA] font-semibold border border-[#2D2938] hover:border-[#B9A8F5]/60 hover:bg-[#262230] hover:text-white focus:ring-[#B9A8F5] shadow-xs',
    outline:
      'bg-transparent text-[#F6F2EA] font-medium border border-[#2D2938] hover:bg-[#1E1B26] hover:border-[#FF6257]/60 active:bg-[#262230] focus:ring-[#FF6257]',
    ghost:
      'bg-transparent text-[#777580] font-medium hover:bg-[#1E1B26] hover:text-[#F6F2EA] active:bg-[#262230] focus:ring-[#FF6257] border border-transparent',
    lime:
      'bg-[#D5F36A] text-[#17151D] font-bold hover:bg-[#c6e655] hover:shadow-md hover:shadow-[#D5F36A]/20 focus:ring-[#D5F36A] border border-transparent',
    lavender:
      'bg-[#B9A8F5] text-[#17151D] font-bold hover:bg-[#a692ec] hover:shadow-md hover:shadow-[#B9A8F5]/20 focus:ring-[#B9A8F5] border border-transparent',
    danger:
      'bg-[#FF6257] text-[#FFFFFF] font-bold hover:bg-[#e64338] hover:shadow-md hover:shadow-[#FF6257]/25 active:bg-[#c93228] focus:ring-[#FF6257] shadow-xs border border-transparent',
    coral:
      'bg-[#FF6257] text-[#17151D] font-bold hover:bg-[#FF4D40] hover:shadow-lg hover:shadow-[#FF6257]/25 active:bg-[#e0382d] focus:ring-[#FF6257] shadow-sm border border-transparent'
  };

  const combinedClasses = `${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
    variantClasses[variant] || variantClasses.primary
  } ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClasses} {...props}>
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
