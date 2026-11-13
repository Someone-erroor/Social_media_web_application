'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';

/**
 * Admin Sidebar Navigation for Looply (Light-First Social Playground)
 * Features a clean mobile header with accessible navigation drawer on mobile (<768px)
 * and a dedicated crisp white sidebar on desktop (768px+).
 */
export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close drawer on Escape key for keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen]);

  const navItems = [
    { label: 'Overview', href: ROUTES.ADMIN.DASHBOARD, icon: 'dashboard' },
    { label: 'Safety Reports', href: ROUTES.ADMIN.REPORTS, icon: 'flag' },
    { label: 'Appeals', href: ROUTES.ADMIN.APPEALS, icon: 'shield' },
    { label: 'User Management', href: ROUTES.ADMIN.USERS, icon: 'users' },
    { label: 'Post Moderation', href: ROUTES.ADMIN.POSTS, icon: 'posts' },
    { label: 'Comment Moderation', href: ROUTES.ADMIN.COMMENTS, icon: 'comments' },
    { label: 'System Activity', href: ROUTES.ADMIN.ACTIVITY, icon: 'activity' },
    { label: 'Admin Alerts', href: ROUTES.ADMIN.NOTIFICATIONS, icon: 'notifications' }
  ];

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto" aria-label="Admin Navigation">
      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#6B6B73] font-display">
        Platform Management
      </div>

      {navItems.map((item) => {
        const isActive =
          item.href === ROUTES.ADMIN.DASHBOARD
            ? pathname === ROUTES.ADMIN.DASHBOARD
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => isMobile && setMobileDrawerOpen(false)}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1 ${
              isActive
                ? 'bg-[#6C63FF] text-white font-bold shadow-xs'
                : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F8F7F4]'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              name={item.icon}
              className={`w-5 h-5 shrink-0 ${
                isActive ? 'text-white' : 'text-[#6B6B73] group-hover:text-[#1E1E24]'
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderFooter = (isMobile = false) => (
    <div className="p-4 border-t border-[#E7E5E0] space-y-3">
      <div className="px-3 py-2.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0]">
        <div className="flex items-center justify-between text-xs text-[#1E1E24] font-medium">
          <span>Admin Clearance</span>
          <span className="text-[10px] font-mono text-[#2E7D4E] bg-[#E8F5E9] px-1.5 py-0.5 rounded border border-[#4CAF78]/30 font-semibold">
            Administrator
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#6B6B73]">
          Management Console &bull; Platform Administration
        </p>
      </div>

      <Link
        href={ROUTES.USER.FEED}
        onClick={() => isMobile && setMobileDrawerOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#6B6B73] hover:text-[#6C63FF] hover:bg-[#F8F7F4] transition-colors"
      >
        <Icon name="arrowLeft" className="w-4 h-4" />
        <span>Return to User Feed</span>
      </Link>

      <button
        type="button"
        onClick={logout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#FF6B6B] hover:bg-[#FFEAEA] transition-colors"
      >
        <Icon name="close" className="w-4 h-4" />
        <span>Sign Out Session</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navigation Bar (<768px) */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-[#FFFFFF] border-b border-[#E7E5E0]">
        <Logo showTagline={false} href={ROUTES.ADMIN.DASHBOARD} />

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20">
            Admin
          </span>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2 rounded-lg text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
            aria-label="Toggle admin navigation menu"
            aria-expanded={mobileDrawerOpen}
          >
            <Icon name={mobileDrawerOpen ? 'close' : 'menu'} className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer (<768px) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-30 bg-[#FFFFFF] border-b border-[#E7E5E0] shadow-xl animate-fade-in flex flex-col max-h-[calc(100vh-4rem)] overflow-y-auto">
          {renderNavLinks(true)}
          {renderFooter(true)}
        </div>
      )}

      {/* Desktop Fixed Left Sidebar (>=768px) */}
      <aside
        className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 border-r border-[#E7E5E0] bg-[#FFFFFF] z-30"
        aria-label="Admin Sidebar"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#E7E5E0]">
          <Logo showTagline={false} href={ROUTES.ADMIN.DASHBOARD} />
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/30">
            Ops
          </span>
        </div>

        {/* Navigation Links */}
        {renderNavLinks(false)}

        {/* Clearance Card & Logout */}
        {renderFooter(false)}
      </aside>
    </>
  );
}
