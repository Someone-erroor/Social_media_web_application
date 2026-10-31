'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * Admin Sidebar Navigation for Looply
 * Features a compact mobile header with accessible navigation drawer on mobile (<768px)
 * and keeps the dedicated fixed dark sidebar unchanged on desktop (768px+).
 */
export default function AdminSidebar() {
  const pathname = usePathname();
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
    { label: 'User Management', href: ROUTES.ADMIN.USERS, icon: 'users' },
    { label: 'Post Moderation', href: ROUTES.ADMIN.POSTS, icon: 'posts' },
    { label: 'Comment Moderation', href: ROUTES.ADMIN.COMMENTS, icon: 'comments' },
    { label: 'System Activity', href: ROUTES.ADMIN.ACTIVITY, icon: 'activity' },
    { label: 'Admin Alerts', href: ROUTES.ADMIN.NOTIFICATIONS, icon: 'notifications' }
  ];

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto" aria-label="Admin Navigation">
      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              name={item.icon}
              className={`w-5 h-5 shrink-0 ${
                isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderFooter = (isMobile = false) => (
    <div className="p-4 border-t border-slate-800 space-y-3">
      <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span>Admin Clearance</span>
          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/50">
            Root Level
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Management Console &bull; Root Clearance
        </p>
      </div>

      <Link
        href={ROUTES.USER.FEED}
        onClick={() => isMobile && setMobileDrawerOpen(false)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <Icon name="arrowLeft" className="w-4 h-4" />
        <span>Return to User Feed</span>
      </Link>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Compact Header (md:hidden) */}
      <div className="md:hidden sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 h-14 flex items-center justify-between text-slate-100">
        <Logo
          size="small"
          showTagline={false}
          href={ROUTES.ADMIN.DASHBOARD}
          inverted={true}
          badgeText="ADMIN"
        />

        <button
          type="button"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Toggle admin navigation menu"
          aria-expanded={mobileDrawerOpen}
        >
          <Icon name={mobileDrawerOpen ? 'close' : 'menu'} className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Mobile Navigation Drawer & Backdrop (md:hidden) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div
            className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 border-r border-slate-800 text-slate-200 shadow-2xl z-10"
            role="dialog"
            aria-modal="true"
            aria-label="Admin Navigation Menu"
          >
            {/* Drawer Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
              <Logo
                size="small"
                showTagline={false}
                href={ROUTES.ADMIN.DASHBOARD}
                inverted={true}
                badgeText="ADMIN"
              />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Close navigation menu"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            {renderNavLinks(true)}

            {/* Drawer Footer */}
            {renderFooter(true)}
          </div>
        </div>
      )}

      {/* 3. Existing Desktop Sidebar (hidden md:flex md:w-64 - UNCHANGED) */}
      <aside
        className="hidden md:flex md:w-64 flex-col md:fixed md:inset-y-0 md:left-0 bg-slate-900 border-r border-slate-800 text-slate-200 z-30"
        aria-label="Admin Sidebar"
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 justify-between">
          <Logo
            showTagline={false}
            href={ROUTES.ADMIN.DASHBOARD}
            inverted={true}
            badgeText="ADMIN"
          />
        </div>

        {renderNavLinks(false)}
        {renderFooter(false)}
      </aside>
    </>
  );
}
