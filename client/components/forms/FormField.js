/**
 * Reusable FormField Component for Looply (Dark Neon Theme)
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
          className="block text-sm font-medium text-[#F4F8FA]"
        >
          {label}
          {required && <span className="ml-1 text-[#FF5C70]" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {error && (
        <p id={id ? `${id}-error` : undefined} className="text-xs text-[#FF5C70]">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p className="text-xs text-[#9BAAB4]">{helperText}</p>
      )}
    </div>
  );
}
