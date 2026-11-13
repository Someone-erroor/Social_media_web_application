'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { useNotifications } from '@/context/NotificationContext';
import { ROUTES } from '@/lib/routes';

/**
 * Mobile Bottom Navigation for User Experience (Warm Social Playground Theme)
 * Fixed to the bottom of the viewport on mobile devices (<768px).
 * Clean White background (#FFFFFF/95), Brand Primary active state (#6C63FF), High-Contrast Slate text (#1E1E24).
 */
export default function UserBottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  const navItems = [
    { label: 'Feed', href: ROUTES.USER.FEED, icon: 'feed' },
    { label: 'Explore', href: ROUTES.USER.EXPLORE, icon: 'explore' },
    { label: 'Play', href: ROUTES.USER.PLAY, icon: 'play' },
    { label: 'Messages', href: ROUTES.USER.MESSAGES, icon: 'message' },
    { label: 'Alerts', href: ROUTES.USER.NOTIFICATIONS, icon: 'notifications' },
    { label: 'Profile', href: ROUTES.USER.PROFILE, icon: 'profile' }
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E7E5E0] z-30 px-2 py-1.5 shadow-lg"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === ROUTES.USER.FEED
              ? pathname === ROUTES.USER.FEED
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-colors relative ${
                isActive
                  ? 'text-[#6C63FF] font-bold'
                  : 'text-[#6B6B73] hover:text-[#1E1E24]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  name={item.icon}
                  className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#6C63FF]' : 'text-[#6B6B73]'}`}
                />
                {item.href === ROUTES.USER.NOTIFICATIONS && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 text-[8px] font-bold text-white bg-[#FF6B6B] rounded-full animate-badge-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
