/**
 * Reusable Card Components for Looply (Editorial Expression Theme)
 * Midnight Ink surfaces (#1E1B26), subtle hairline borders (#2D2938), and Warm Ivory (#F6F2EA) typography.
 */

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-[#2D2938] bg-[#1E1B26] shadow-xl shadow-black/40 transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-[#2D2938] flex flex-col gap-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-base font-bold text-[#F6F2EA] font-display tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-xs text-[#777580] leading-normal ${className}`} {...props}>
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
      className={`px-5 py-3.5 bg-[#17151D] border-t border-[#2D2938] rounded-b-2xl flex items-center justify-between text-xs text-[#777580] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
