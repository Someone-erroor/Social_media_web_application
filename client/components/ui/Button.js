import Link from 'next/link';

/**
 * Reusable Button Component for Looply (Dark Neon Theme)
 * Supports semantic button and Next.js Link variants, accessible focus rings, and states.
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
    'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#080D12] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 select-none rounded-xl cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5'
  };

  const variantClasses = {
    primary:
      'bg-[#19D3E3] text-[#080D12] font-bold hover:bg-[#00B8C8] hover:shadow-lg hover:shadow-[#19D3E3]/30 active:bg-[#009da9] focus:ring-[#19D3E3] shadow-md shadow-[#19D3E3]/15 border border-transparent',
    secondary:
      'bg-[#151F29] text-[#F4F8FA] font-medium border border-[#19D3E3]/40 hover:border-[#19D3E3] hover:bg-[#1D2A35] hover:shadow-md hover:shadow-[#19D3E3]/10 active:bg-[#23333E] focus:ring-[#19D3E3]',
    outline:
      'bg-transparent text-[#F4F8FA] font-medium border border-[#263640] hover:bg-[#151F29] hover:border-[#19D3E3]/60 hover:shadow-sm active:bg-[#1D2A35] focus:ring-[#19D3E3]',
    ghost:
      'bg-transparent text-[#9BAAB4] font-medium hover:bg-[#151F29] hover:text-[#19D3E3] active:bg-[#1D2A35] focus:ring-[#19D3E3] border border-transparent',
    coral:
      'bg-[#FF6F61] text-[#080D12] font-bold hover:bg-[#e85a4d] hover:shadow-lg hover:shadow-[#FF6F61]/30 active:bg-[#d4483b] focus:ring-[#FF6F61] shadow-md shadow-[#FF6F61]/20 border border-transparent',
    danger:
      'bg-[#FF5C70] text-[#080D12] font-bold hover:bg-[#e64358] hover:shadow-md hover:shadow-[#FF5C70]/30 active:bg-[#cf3247] focus:ring-[#FF5C70] shadow-sm border border-transparent'
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
