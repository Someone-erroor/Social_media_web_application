'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/navigation/AdminSidebar';
import AdminHeader from '@/components/navigation/AdminHeader';
import { ROUTES } from '@/lib/routes';

/**
 * AdminShell Layout Component for Looply (Dark Neon Theme)
 * Distinct high-contrast administrative workspace.
 * Deep dark background (#080D12), elevated graphite cards, electric cyan active indicators.
 */
export default function AdminShell({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace(ROUTES.PUBLIC.LOGIN);
      } else if (user.role !== 'admin') {
        router.replace(ROUTES.USER.FEED);
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080D12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#263640] border-t-[#19D3E3] rounded-full animate-spin" />
          <p className="text-xs text-[#9BAAB4] font-medium">Verifying Administrator Access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
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
