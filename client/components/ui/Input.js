/**
 * Reusable Input Component for Looply (Dark Neon Theme)
 * Dark elevated background, white text, muted placeholders, cyan focus border.
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
    'w-full rounded-xl border bg-[#101A22] px-3.5 py-2.5 text-sm text-[#F4F8FA] transition-colors placeholder:text-[#9BAAB4] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#080D12] disabled:bg-[#080D12] disabled:text-[#9BAAB4]/50 disabled:cursor-not-allowed';

  const stateClasses = error
    ? 'border-[#FF5C70] focus:border-[#FF5C70] focus:ring-[#FF5C70]/20'
    : 'border-[#263640] focus:border-[#19D3E3] focus:ring-[#19D3E3]/20';

  const iconPadding = icon ? 'pl-10' : '';
  const actionPadding = action ? 'pr-11' : '';

  return (
    <div className="relative w-full">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9BAAB4]">
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
