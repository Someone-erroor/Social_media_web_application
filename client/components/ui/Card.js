/**
 * Reusable Card Components for Looply
 * Consistent styling, rounded borders, and subtle elevation across views.
 */

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-[#E3E8E8] bg-white shadow-xs transition-shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-[#E3E8E8] flex flex-col gap-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-base font-semibold text-[#172126] tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-xs text-[#58666D] leading-normal ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-3.5 bg-[#F6F8F7] border-t border-[#E3E8E8] rounded-b-2xl flex items-center justify-between text-xs text-[#58666D] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;

