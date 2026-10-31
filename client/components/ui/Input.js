/**
 * Reusable Input Component for Looply
 * Clean, consistent styling, error boundaries, accessible focus rings.
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
    'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

  const stateClasses = error
    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-400'
    : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-500/20';

  const iconPadding = icon ? 'pl-10' : '';
  const actionPadding = action ? 'pr-11' : '';

  return (
    <div className="relative w-full">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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

