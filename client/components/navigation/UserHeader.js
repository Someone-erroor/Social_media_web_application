'use client';

import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ROUTES } from '@/lib/routes';

/**
 * Top Header for User Experience
 * Provides mobile branding with direct link to feed, search bar, and user access.
 */
export default function UserHeader() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-20 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Mobile Logo: links strictly to Feed */}
        <div className="md:hidden flex items-center">
          <Logo size="small" showTagline={false} href={ROUTES.USER.FEED} />
        </div>

        {/* Global Search Bar Placeholder */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Icon name="search" className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search posts, topics, or creators..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
              disabled
              title="Search coming soon"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Link
            href={ROUTES.USER.NOTIFICATIONS}
            className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors relative"
            aria-label="View notifications"
          >
            <Icon name="notifications" className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-indigo-600 rounded-full animate-badge-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href={ROUTES.USER.PROFILE}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all"
            aria-label="View profile"
          >
            <Avatar name={user?.fullName || 'Guest User'} src={user?.profile?.avatarUrl} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}

