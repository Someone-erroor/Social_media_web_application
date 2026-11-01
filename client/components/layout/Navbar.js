import Logo from '@/components/brand/Logo';

export default function Navbar() {
  return (
    <header className="w-full border-b border-[#E3E8E8] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo showTagline={false} />
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Looply Active
          </span>
        </div>
      </div>
    </header>
  );
}
