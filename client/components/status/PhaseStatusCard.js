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
    <div className="w-full bg-[#151F29] rounded-2xl border border-[#263640] shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between border-b border-[#263640] pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#F4F8FA]">Platform Initialization</h2>
          <p className="text-xs text-[#9BAAB4] mt-0.5">Foundational verification and architecture readiness</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30">
          Ready for Review
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checklist.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-xl bg-[#101A22] border border-[#263640]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                ✓
              </div>
              <span className="text-sm font-medium text-[#F4F8FA]">{item.label}</span>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
