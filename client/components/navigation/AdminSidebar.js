'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * Admin Sidebar Navigation for Looply
 * Distinct dark slate aesthetic, isolated from user navigation.
 * All admin routes clearly separated.
 */
export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: ROUTES.ADMIN.DASHBOARD, icon: 'dashboard' },
    { label: 'User Management', href: ROUTES.ADMIN.USERS, icon: 'users' },
    { label: 'Post Moderation', href: ROUTES.ADMIN.POSTS, icon: 'posts' },
    { label: 'Comment Moderation', href: ROUTES.ADMIN.COMMENTS, icon: 'comments' },
    { label: 'System Activity', href: ROUTES.ADMIN.ACTIVITY, icon: 'activity' },
    { label: 'Admin Alerts', href: ROUTES.ADMIN.NOTIFICATIONS, icon: 'notifications' }
  ];

  return (
    <aside
      className="w-full md:w-64 flex flex-col md:fixed md:inset-y-0 md:left-0 bg-slate-900 border-r border-slate-800 text-slate-200 z-30"
      aria-label="Admin Sidebar"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 justify-between">
        <Logo
          showTagline={false}
          href={ROUTES.ADMIN.DASHBOARD}
          inverted={true}
          badgeText="ADMIN"
        />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto" aria-label="Admin Navigation">
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

      {/* Switcher & System Info Footer */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span>Admin Clearance</span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/50">
              Root Level
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            UI Shell • Operations in Phase 12
          </p>
        </div>

        <Link
          href={ROUTES.USER.FEED}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          <span>Return to User Feed</span>
        </Link>
      </div>
    </aside>
  );
}

