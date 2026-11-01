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

  const getInitials = (text) => {
    if (!text) return 'GU';
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.fullName || 'Guest User';
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur-md border-b border-[#E3E8E8]">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Mobile Logo: links strictly to Feed */}
        <div className="md:hidden flex items-center">
          <Logo size="small" showTagline={false} href={ROUTES.USER.FEED} />
        </div>

        {/* Global Explore Shortcut */}
        <div className="flex-1 max-w-md hidden sm:block">
          <Link
            href={ROUTES.USER.EXPLORE}
            className="flex items-center gap-2.5 w-full rounded-full border border-[#E3E8E8] bg-[#F6F8F7] hover:bg-white hover:border-[#16B8C8] px-4 py-1.5 text-xs text-[#252E34] hover:text-[#172126] transition-all shadow-2xs group"
          >
            <Icon name="search" className="w-4 h-4 text-[#087F8A] transition-colors" />
            <span className="font-medium">Explore posts, topics, and community creators...</span>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Link
            href={ROUTES.USER.NOTIFICATIONS}
            className="p-2 rounded-full text-[#58666D] hover:text-[#172126] hover:bg-[#F6F8F7] transition-colors relative"
            aria-label="View notifications"
          >
            <Icon name="notifications" className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-[#FF725E] rounded-full animate-badge-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href={ROUTES.USER.PROFILE}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#16B8C8]/30 transition-all min-w-[28px] min-h-[28px]"
            aria-label={`${initials} - ${displayName} Profile`}
          >
            <Avatar name={displayName} src={user?.profile?.avatarUrl} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}

