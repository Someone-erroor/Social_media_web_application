/**
 * Reusable FormField Component for Looply
 * Manages labels, required marks, helper text, and validation messaging with proper accessibility.
 */
export default function FormField({
  id,
  label,
  helperText,
  error,
  required = false,
  className = '',
  children
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#252E34]"
        >
          {label}
          {required && <span className="ml-1 text-rose-500" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {error && (
        <p id={id ? `${id}-error` : undefined} className="text-xs text-rose-600">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p className="text-xs text-[#58666D]">{helperText}</p>
      )}
    </div>
  );
}

