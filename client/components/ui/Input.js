/**
 * Reusable Input Component for Looply (Warm Social Playground Theme)
 * Crisp White background, High-Contrast Slate text (#1E1E24),
 * Slate placeholders (#6B6B73), and Brand Primary focus ring (#6C63FF).
 */
export default function Input({
  id,
  name,
  type = 'text',
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  icon,
  action,
  className = '',
  ...props
}) {
  const baseClasses =
    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#1E1E24] transition-all duration-200 placeholder:text-[#6B6B73]/60 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#F8F7F4] focus:shadow-sm focus:shadow-[#6C63FF]/15 disabled:bg-[#F1F0EC] disabled:text-[#6B6B73]/50 disabled:cursor-not-allowed';

  const stateClasses = error
    ? 'border-[#FF6B6B] focus:border-[#FF6B6B] focus:ring-[#FF6B6B]/30'
    : 'border-[#E7E5E0] focus:border-[#6C63FF] focus:ring-[#6C63FF]/20';

  const iconPadding = icon ? 'pl-10' : '';
  const actionPadding = action ? 'pr-11' : '';

  return (
    <div className="relative w-full">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6B6B73]">
          {icon}
        </div>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${baseClasses} ${stateClasses} ${iconPadding} ${actionPadding} ${className}`}
        {...props}
      />
      {action && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {action}
        </div>
      )}
    </div>
  );
}
