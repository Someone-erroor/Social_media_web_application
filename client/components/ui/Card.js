/**
 * Reusable Card Components for Looply (Warm Social Playground Theme)
 * Crisp White surfaces (#FFFFFF), subtle hairline borders (#E7E5E0),
 * and High-Contrast Slate (#1E1E24) typography with soft 16-20px rounded corners.
 */

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-[#E7E5E0] bg-white shadow-xs transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-[#E7E5E0] flex flex-col gap-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-base font-bold text-[#1E1E24] font-display tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-xs text-[#6B6B73] leading-normal ${className}`} {...props}>
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
      className={`px-5 py-3.5 bg-[#F1F0EC]/60 border-t border-[#E7E5E0] rounded-b-2xl flex items-center justify-between text-xs text-[#6B6B73] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
