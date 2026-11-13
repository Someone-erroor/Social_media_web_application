import Link from 'next/link';

/**
 * Reusable Button Component for Looply (Warm Social Playground Theme)
 * Features Brand Primary (#6C63FF), Joy Yellow (#FFD166), Coral (#FF6B6B), and Soft Lavender (#EEEAFE)
 * with 10-12px rounded corners, accessible focus rings, and tactile click feedback.
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
    'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#F8F7F4] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 select-none rounded-xl cursor-pointer tracking-tight';

  const sizeClasses = {
    xs: 'text-[11px] px-2.5 py-1 gap-1 rounded-lg',
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4.5 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5 rounded-2xl'
  };

  const variantClasses = {
    primary:
      'bg-[#6C63FF] text-white font-bold hover:bg-[#574FE8] hover:shadow-md hover:shadow-[#6C63FF]/25 active:bg-[#483fe0] focus:ring-[#6C63FF] shadow-xs border border-transparent',
    secondary:
      'bg-[#F1F0EC] text-[#1E1E24] font-semibold border border-[#E7E5E0] hover:bg-[#E7E5E0] hover:text-[#1E1E24] focus:ring-[#6C63FF] shadow-xs',
    outline:
      'bg-white text-[#1E1E24] font-semibold border border-[#E7E5E0] hover:bg-[#F1F0EC] hover:border-[#6C63FF]/40 active:bg-[#E7E5E0] focus:ring-[#6C63FF] shadow-xs',
    ghost:
      'bg-transparent text-[#6B6B73] font-medium hover:bg-[#F1F0EC] hover:text-[#1E1E24] active:bg-[#E7E5E0] focus:ring-[#6C63FF] border border-transparent',
    yellow:
      'bg-[#FFD166] text-[#1E1E24] font-bold hover:bg-[#F5C247] hover:shadow-md hover:shadow-[#FFD166]/25 focus:ring-[#FFD166] border border-transparent',
    lime:
      'bg-[#4CAF78] text-white font-bold hover:bg-[#3E9B66] hover:shadow-md hover:shadow-[#4CAF78]/25 focus:ring-[#4CAF78] border border-transparent',
    lavender:
      'bg-[#EEEAFE] text-[#6C63FF] font-bold hover:bg-[#DFD8FC] hover:shadow-sm focus:ring-[#6C63FF] border border-transparent',
    danger:
      'bg-[#FF6B6B] text-white font-bold hover:bg-[#F25757] hover:shadow-md hover:shadow-[#FF6B6B]/25 active:bg-[#e04848] focus:ring-[#FF6B6B] shadow-xs border border-transparent',
    coral:
      'bg-[#FF6B6B] text-white font-bold hover:bg-[#F25757] hover:shadow-md hover:shadow-[#FF6B6B]/25 active:bg-[#e04848] focus:ring-[#FF6B6B] shadow-xs border border-transparent'
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
