import AdminSidebar from '@/components/navigation/AdminSidebar';
import AdminHeader from '@/components/navigation/AdminHeader';

/**
 * AdminShell Layout Component for Looply
 * Distinct high-contrast management workspace.
 */
export default function AdminShell({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased">
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

