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
    <div className="w-full bg-white rounded-2xl border border-[#E3E8E8] shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between border-b border-[#E3E8E8] pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#172126]">Platform Initialization</h2>
          <p className="text-xs text-[#68757C] mt-0.5">Foundational verification and architecture readiness</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-cyan-50 text-[#087F8A] border border-cyan-100">
          Ready for Review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checklist.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-xl bg-[#F6F8F7] border border-[#E3E8E8]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                ✓
              </div>
              <span className="text-sm font-medium text-[#252E34]">{item.label}</span>
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
