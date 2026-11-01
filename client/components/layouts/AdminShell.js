'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/navigation/AdminSidebar';
import AdminHeader from '@/components/navigation/AdminHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * AdminShell Layout Component for Looply (Dark Neon Theme)
 * Distinct high-contrast administrative workspace.
 * Deep dark background (#080D12), elevated graphite cards, electric cyan active indicators.
 * If user is unauthenticated or lacks admin role, presents dedicated admin clearance guidance.
 */
export default function AdminShell({ children }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login?admin=true&redirect=/admin');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080D12] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#263640] border-t-[#19D3E3] rounded-full animate-spin" />
          <p className="text-xs text-[#9BAAB4] font-medium">Verifying Administrator Access...</p>
        </div>
      </div>
    );
  }

  // If not logged in, wait for redirect
  if (!isAuthenticated) {
    return null;
  }

  // If logged in as standard user without admin privileges
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#080D12] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 sm:p-8 text-center space-y-5 bg-[#151F29] border-[#263640] shadow-2xl shadow-black/60">
          <div className="w-16 h-16 rounded-2xl bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30 mx-auto flex items-center justify-center shadow-lg shadow-[#19D3E3]/10">
            <Icon name="shield" className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FF6F61]/15 text-[#FF6F61] border border-[#FF6F61]/30">
              Clearance Required
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#F4F8FA] tracking-tight">
              Administrator Access Required
            </h2>
            <p className="text-xs text-[#9BAAB4] leading-relaxed">
              You are currently signed in as{' '}
              <strong className="text-[#F4F8FA] font-semibold">{user.fullName || 'Member'}</strong>{' '}
              (<span className="font-mono text-[#19D3E3]">{user.email}</span>), which is a standard member account.
            </p>
            <p className="text-xs text-[#9BAAB4] leading-relaxed">
              The Looply Administration Console is reserved strictly for platform administrators.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              onClick={async () => {
                await logout();
                router.push('/login?admin=true&redirect=/admin');
              }}
              icon={<Icon name="shield" className="w-4 h-4" />}
            >
              Sign In as Admin
            </Button>
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              onClick={() => router.push(ROUTES.USER.FEED)}
              icon={<Icon name="arrowLeft" className="w-4 h-4" />}
            >
              Return to Feed
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080D12] text-[#F4F8FA] flex flex-col antialiased">
      {/* Admin Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Administrative Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
