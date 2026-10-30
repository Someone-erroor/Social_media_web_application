export default function PhaseStatusCard() {
  const checklist = [
    { label: 'Next.js 16 App Router (JavaScript)', status: 'Configured' },
    { label: 'Tailwind CSS Modern Styling', status: 'Active' },
    { label: 'Modular Client Architecture', status: 'Established' },
    { label: 'Centralized Route System (ROUTES)', status: 'Configured' },
    { label: 'Express.js Modular Backend', status: 'Ready' },
    { label: 'Health Check Endpoint (/api/health)', status: 'Operational' },
    { label: 'Environment-Governed CORS', status: 'Enforced' }
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Phase 1: Project Initialization</h2>
          <p className="text-xs text-slate-500 mt-0.5">Foundational verification and architecture readiness</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
          Ready for Review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checklist.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                ✓
              </div>
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
