/**
 * Authentication Route Group Layout
 * Dedicated layout wrapper for authentication experiences (login, register, reset, verification)
 */
export default function AuthLayout({ children }) {
  return (
    <div className="auth-experience min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      {children}
    </div>
  );
}
