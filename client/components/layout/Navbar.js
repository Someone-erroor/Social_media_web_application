import Logo from '@/components/brand/Logo';

export default function Navbar() {
  return (
    <header className="w-full border-b border-[#263640] bg-[#101A22]/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo showTagline={false} />
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Looply Active
          </span>
        </div>
      </div>
    </header>
  );
}
