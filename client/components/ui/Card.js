/**
 * Reusable Card Components for Looply (Dark Neon Theme)
 * Dark graphite surfaces (#151F29), subtle border (#263640), and elevated styling.
 */

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-[#263640] bg-[#151F29] shadow-md shadow-black/20 transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-[#263640] flex flex-col gap-1 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-base font-semibold text-[#F4F8FA] tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-xs text-[#9BAAB4] leading-normal ${className}`} {...props}>
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
      className={`px-5 py-3.5 bg-[#101A22] border-t border-[#263640] rounded-b-2xl flex items-center justify-between text-xs text-[#9BAAB4] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
