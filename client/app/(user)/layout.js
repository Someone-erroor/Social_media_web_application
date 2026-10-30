/**
 * User Route Group Layout
 * Dedicated layout wrapper for user experiences (feed, explore, profile, assistant, settings)
 * Architecture established in Phase 1; dashboard functionality deferred to subsequent phases.
 */
export default function UserLayout({ children }) {
  return (
    <div className="user-experience min-h-screen flex flex-col bg-slate-50">
      {children}
    </div>
  );
}
