'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';

/**
 * Admin Sidebar Navigation for Looply (Editorial Expression Theme)
 * Features a compact mobile header with accessible navigation drawer on mobile (<768px)
 * and keeps the dedicated fixed Midnight Ink sidebar unchanged on desktop (768px+).
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
      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#777580] font-display">
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
                ? 'bg-[#FF6257] text-[#17151D] font-bold shadow-md shadow-[#FF6257]/20'
                : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              name={item.icon}
              className={`w-5 h-5 shrink-0 ${
                isActive ? 'text-[#17151D]' : 'text-[#777580] group-hover:text-[#F6F2EA]'
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderFooter = (isMobile = false) => (
    <div className="p-4 border-t border-[#2D2938] space-y-3">
      <div className="px-3 py-2.5 rounded-xl bg-[#1E1B26] border border-[#2D2938]">
        <div className="flex items-center justify-between text-xs text-[#F6F2EA] font-medium">
          <span>Admin Clearance</span>
          <span className="text-[10px] font-mono text-[#D5F36A] bg-[#110F17] px-1.5 py-0.5 rounded border border-[#2D2938]">
            Administrator
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#777580]">
          Management Console &bull; Platform Administration
        </p>
      </div>

      <Link
        href={ROUTES.USER.FEED}
        onClick={() => isMobile && setMobileDrawerOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#777580] hover:text-[#FF6257] hover:bg-[#1E1B26] transition-colors"
      >
        <Icon name="arrowLeft" className="w-4 h-4" />
        <span>Return to User Feed</span>
      </Link>

      <button
        type="button"
        onClick={logout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#FF6257] hover:bg-[#FF6257]/10 transition-colors"
      >
        <Icon name="close" className="w-4 h-4" />
        <span>Sign Out Session</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navigation Bar (<768px) */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-[#17151D] border-b border-[#2D2938]">
        <Logo showTagline={false} href={ROUTES.ADMIN.DASHBOARD} />

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30">
            Admin
          </span>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="p-2 rounded-lg text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26] focus:outline-none focus:ring-2 focus:ring-[#FF6257]"
            aria-label="Toggle admin navigation menu"
            aria-expanded={mobileDrawerOpen}
          >
            <Icon name={mobileDrawerOpen ? 'close' : 'menu'} className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer (<768px) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-30 bg-[#17151D] border-b border-[#2D2938] shadow-2xl animate-fade-in flex flex-col max-h-[calc(100vh-4rem)] overflow-y-auto">
          {renderNavLinks(true)}
          {renderFooter(true)}
        </div>
      )}

      {/* Desktop Fixed Left Sidebar (>=768px) */}
      <aside
        className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 border-r border-[#2D2938] bg-[#17151D] z-30"
        aria-label="Admin Sidebar"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#2D2938]">
          <Logo showTagline={false} href={ROUTES.ADMIN.DASHBOARD} />
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded bg-[#B9A8F5]/15 text-[#B9A8F5] border border-[#B9A8F5]/30">
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
