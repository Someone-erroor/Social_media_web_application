/**
 * Reusable Input Component for Looply (Editorial Expression Theme)
 * Midnight Ink elevated background (#17151D), Warm Ivory text (#F6F2EA),
 * Slate placeholders (#777580), and Electric Coral focus rings (#FF6257).
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
    'w-full rounded-xl border bg-[#17151D] px-3.5 py-2.5 text-sm text-[#F6F2EA] transition-all duration-200 placeholder:text-[#777580] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#110F17] focus:shadow-md focus:shadow-[#FF6257]/15 disabled:bg-[#110F17] disabled:text-[#777580]/50 disabled:cursor-not-allowed';

  const stateClasses = error
    ? 'border-[#FF6257] focus:border-[#FF6257] focus:ring-[#FF6257]/30'
    : 'border-[#2D2938] focus:border-[#FF6257] focus:ring-[#FF6257]/20';

  const iconPadding = icon ? 'pl-10' : '';
  const actionPadding = action ? 'pr-11' : '';

  return (
    <div className="relative w-full">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#777580]">
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
