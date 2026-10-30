import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Logo from '@/components/brand/Logo';
import PhaseStatusCard from '@/components/status/PhaseStatusCard';
import { ROUTES } from '@/lib/routes';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex justify-center mb-6">
            <Logo size="large" showTagline={true} href={ROUTES.PUBLIC.HOME} />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Next-Generation Social Media Platform
          </h1>
          <p className="mt-4 text-base text-slate-600 leading-relaxed">
            Frontend initialization successful. Running on Next.js App Router with Tailwind CSS,
            modular component architecture, and centralized routing configuration.
          </p>
        </div>

        {/* Phase Status Overview */}
        <div className="w-full max-w-3xl">
          <PhaseStatusCard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
