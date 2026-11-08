'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';

/**
 * Desktop User Sidebar Navigation for Looply (Editorial Expression Theme)
 * Midnight Ink background (#17151D), Electric Coral active links (#FF6257), Warm Ivory text (#F6F2EA).
 */
export default function UserSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Feed', href: ROUTES.USER.FEED, icon: 'feed' },
    { label: 'Explore', href: ROUTES.USER.EXPLORE, icon: 'explore' },
    { label: 'Messages', href: ROUTES.USER.MESSAGES, icon: 'message' },
    { label: 'Looply Play', href: ROUTES.USER.PLAY, icon: 'play' },
    { label: 'Time Capsule', href: ROUTES.USER.TIME_CAPSULE, icon: 'vault' },
    { label: 'Circles', href: ROUTES.USER.CIRCLES, icon: 'circles' },
    { label: 'Global Events', href: ROUTES.USER.EVENTS, icon: 'events' },
    { label: 'Notifications', href: ROUTES.USER.NOTIFICATIONS, icon: 'notifications' },
    { label: 'Profile', href: ROUTES.USER.PROFILE, icon: 'profile' },
    { label: 'AI Assistant', href: ROUTES.USER.ASSISTANT, icon: 'assistant' },
    { label: 'Settings', href: ROUTES.USER.SETTINGS, icon: 'settings' }
  ];

  return (
    <aside
      className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 border-r border-[#2D2938] bg-[#17151D] z-30"
      aria-label="User Sidebar"
    >
      {/* Brand Header: Logo links strictly to Feed inside User experience */}
      <div className="h-16 flex items-center px-6 border-b border-[#2D2938]">
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
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1 ${
                isActive
                  ? 'bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30 font-semibold shadow-sm'
                  : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                name={item.icon}
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-[#FF6257]' : 'text-[#777580]'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Switcher & User Teaser Footer */}
      <div className="p-4 border-t border-[#2D2938] space-y-3">
        {user?.role === 'admin' && (
          <Link
            href={ROUTES.ADMIN.DASHBOARD}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#B9A8F5] hover:text-[#F6F2EA] hover:bg-[#1E1B26] border border-[#2D2938] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Icon name="shield" className="w-4 h-4 text-[#B9A8F5]" />
              Admin Console
            </span>
            <span className="text-[10px] uppercase font-bold text-[#B9A8F5] bg-[#24202E] border border-[#B9A8F5]/30 px-1.5 py-0.5 rounded">
              Portal
            </span>
          </Link>
        )}

        {/* User Card & Logout */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1E1B26] border border-[#2D2938]">
          <Link
            href={ROUTES.USER.PROFILE}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
          >
            <Avatar name={user?.fullName || 'Guest User'} size="sm" status={user ? 'online' : 'offline'} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#F6F2EA] truncate">
                {user?.fullName || 'Guest User'}
              </p>
              <p className="text-[11px] text-[#777580] truncate font-mono">
                {user ? `@${user.email?.split('@')[0]}` : 'Active Session'}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-[#777580] hover:text-[#FF6257] rounded-lg hover:bg-[#24202E] transition-colors focus:outline-none focus:ring-1 focus:ring-[#FF6257]"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
