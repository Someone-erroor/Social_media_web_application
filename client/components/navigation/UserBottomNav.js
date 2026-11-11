'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * Mobile Bottom Navigation for User Experience (Editorial Expression Theme)
 * Fixed to the bottom of the viewport on mobile devices (<768px).
 * Midnight Ink background (#17151D), Electric Coral active state (#FF6257), Warm Ivory text (#F6F2EA).
 */
export default function UserBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Feed', href: ROUTES.USER.FEED, icon: 'feed' },
    { label: 'Explore', href: ROUTES.USER.EXPLORE, icon: 'explore' },
    { label: 'Experiences', href: ROUTES.USER.EXPERIENCES, icon: 'experiences' },
    { label: 'Messages', href: ROUTES.USER.MESSAGES, icon: 'message' },
    { label: 'Alerts', href: ROUTES.USER.NOTIFICATIONS, icon: 'notifications' },
    { label: 'Profile', href: ROUTES.USER.PROFILE, icon: 'profile' }
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-[#17151D]/95 backdrop-blur-md border-t border-[#2D2938] z-30 px-2 py-1.5 shadow-2xl"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === ROUTES.USER.FEED
              ? pathname === ROUTES.USER.FEED
              : item.href === ROUTES.USER.EXPERIENCES
              ? pathname.startsWith(ROUTES.USER.EXPERIENCES) ||
                pathname.startsWith('/play') ||
                pathname.startsWith('/time-capsule') ||
                pathname.startsWith('/circles') ||
                pathname.startsWith('/events')
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[#FF6257] font-bold'
                  : 'text-[#777580] hover:text-[#F6F2EA]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                name={item.icon}
                className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#FF6257]' : 'text-[#777580]'}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
