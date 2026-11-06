'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * Mobile Bottom Navigation for User Experience (Dark Neon Theme)
 * Fixed to the bottom of the viewport on mobile devices (<768px).
 * Dark graphite background (#101A22), neon cyan active state (#19D3E3).
 */
export default function UserBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: ROUTES.USER.FEED, icon: 'feed' },
    { label: 'Explore', href: ROUTES.USER.EXPLORE, icon: 'explore' },
    { label: 'Messages', href: ROUTES.USER.MESSAGES, icon: 'message' },
    { label: 'Play', href: ROUTES.USER.PLAY, icon: 'play' },
    { label: 'Alerts', href: ROUTES.USER.NOTIFICATIONS, icon: 'notifications' },
    { label: 'Profile', href: ROUTES.USER.PROFILE, icon: 'profile' }
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-[#101A22]/95 backdrop-blur-md border-t border-[#263640] z-30 px-2 py-1.5 shadow-2xl"
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
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[#19D3E3] font-semibold'
                  : 'text-[#9BAAB4] hover:text-[#F4F8FA]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                name={item.icon}
                className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#19D3E3]' : 'text-[#9BAAB4]'}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
