/**
 * Reusable FormField Component for Looply (Warm Social Playground Theme)
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
          className="block text-sm font-semibold text-[#1E1E24]"
        >
          {label}
          {required && <span className="ml-1 text-[#FF6B6B]" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {error && (
        <p id={id ? `${id}-error` : undefined} className="text-xs text-[#FF6B6B]">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p className="text-xs text-[#6B6B73]">{helperText}</p>
      )}
    </div>
  );
}
