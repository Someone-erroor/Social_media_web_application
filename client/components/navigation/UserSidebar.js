'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * Desktop User Sidebar Navigation for Looply
 * Logo links strictly to /feed inside user app.
 * Highlights current active route with smooth indicator.
 */
export default function UserSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: ROUTES.USER.FEED, icon: 'feed' },
    { label: 'Explore', href: ROUTES.USER.EXPLORE, icon: 'explore' },
    { label: 'Notifications', href: ROUTES.USER.NOTIFICATIONS, icon: 'notifications' },
    { label: 'Profile', href: ROUTES.USER.PROFILE, icon: 'profile' },
    { label: 'AI Assistant', href: ROUTES.USER.ASSISTANT, icon: 'assistant' },
    { label: 'Settings', href: ROUTES.USER.SETTINGS, icon: 'settings' }
  ];

  return (
    <aside
      className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 border-r border-slate-200/80 bg-white z-30"
      aria-label="User Sidebar"
    >
      {/* Brand Header: Logo links strictly to Feed inside User experience */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <Logo showTagline={false} href={ROUTES.USER.FEED} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="User Navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === ROUTES.USER.FEED
              ? pathname === ROUTES.USER.FEED
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                name={item.icon}
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Switcher & User Teaser Footer */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <Link
          href={ROUTES.ADMIN.DASHBOARD}
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Icon name="shield" className="w-4 h-4 text-slate-400" />
            Admin Console
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            Portal
          </span>
        </Link>

        {/* User Card Placeholder */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <Avatar name="Guest User" size="sm" status="online" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">Preview Guest</p>
            <p className="text-[11px] text-slate-500 truncate">Active Session</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

