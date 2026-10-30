/**
 * Admin Route Group Layout
 * Dedicated layout wrapper for administrator experiences (user management, moderation, audit)
 * Completely isolated from user navigation. Admin dashboard functionality deferred to subsequent phases.
 */
export default function AdminLayout({ children }) {
  return (
    <div className="admin-experience min-h-screen flex flex-col bg-slate-900 text-slate-100">
      {children}
    </div>
  );
}
