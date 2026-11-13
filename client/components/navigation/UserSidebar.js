'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/brand/Logo';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ROUTES } from '@/lib/routes';

/**
 * Desktop User Sidebar Navigation for Looply (Warm Social Playground Theme)
 * White background (#FFFFFF), border (#E7E5E0), Brand Primary active links (#6C63FF) with Soft Lavender (#EEEAFE).
 * Streamlines primary social destinations and groups signature experiences cleanly.
 */
export default function UserSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [experiencesOpen, setExperiencesOpen] = useState(true);

  const primaryNavItems = [
    { label: 'Feed', href: ROUTES.USER.FEED, icon: 'feed' },
    { label: 'Explore', href: ROUTES.USER.EXPLORE, icon: 'explore' },
    { label: 'Play', href: ROUTES.USER.PLAY, icon: 'play', badge: 'Play' },
    { label: 'Messages', href: ROUTES.USER.MESSAGES, icon: 'message' },
    { label: 'Notifications', href: ROUTES.USER.NOTIFICATIONS, icon: 'notifications' }
  ];

  const experienceItems = [
    { label: 'Split-Reality', href: ROUTES.USER.FEED, icon: 'split', tag: 'Dual' },
    { label: 'Mood-Orbit', href: ROUTES.USER.MOOD_ORBIT, icon: 'mood', tag: 'Live' },
    { label: 'Time Capsules', href: ROUTES.USER.TIME_CAPSULE, icon: 'vault', tag: 'Vault' },
    { label: 'Circles', href: ROUTES.USER.CIRCLES, icon: 'circles', tag: 'Spaces' },
    { label: 'Mystery Events', href: ROUTES.USER.EVENTS, icon: 'events', tag: 'Clues' },
    { label: 'Feed Heists', href: ROUTES.USER.HEISTS, icon: 'heist', tag: 'Quest' },
    { label: 'All Experiences', href: ROUTES.USER.EXPERIENCES, icon: 'experiences', tag: 'Hub' }
  ];

  const secondaryNavItems = [
    { label: 'AI Assistant', href: ROUTES.USER.ASSISTANT, icon: 'assistant' },
    { label: 'Settings', href: ROUTES.USER.SETTINGS, icon: 'settings' }
  ];

  const isPrimaryActive = (href) => {
    if (href === ROUTES.USER.FEED) {
      return pathname === ROUTES.USER.FEED;
    }
    return pathname.startsWith(href);
  };

  const isExperienceActive = (href) => {
    if (href === ROUTES.USER.FEED) return false;
    if (href === ROUTES.USER.EXPERIENCES) return pathname === ROUTES.USER.EXPERIENCES;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="hidden md:flex md:w-64 flex-col fixed inset-y-0 left-0 border-r border-[#E7E5E0] bg-white z-30"
      aria-label="User Sidebar"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#E7E5E0]">
        <Logo showTagline={false} href={ROUTES.USER.FEED} />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 py-4 space-y-5 overflow-y-auto" aria-label="User Navigation">
        {/* Primary Social Destinations */}
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#6B6B73]">
            Menu
          </p>
          {primaryNavItems.map((item) => {
            const isActive = isPrimaryActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#EEEAFE] text-[#6C63FF] font-bold shadow-xs'
                    : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    name={item.icon}
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-[#6C63FF]' : 'text-[#6B6B73]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.href === ROUTES.USER.NOTIFICATIONS && unreadCount > 0 ? (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-[#FF6B6B] rounded-full shadow-xs animate-badge-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : item.badge && !isActive ? (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFF7E0] text-[#B28200] border border-[#FFD166]/40">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Grouped & Expandable Signature Experiences */}
        <div className="pt-2 border-t border-[#E7E5E0] space-y-1">
          <div className="flex items-center justify-between px-3 pb-1">
            <button
              type="button"
              onClick={() => setExperiencesOpen((prev) => !prev)}
              className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-wider text-[#6B6B73] hover:text-[#1E1E24] transition-colors cursor-pointer"
            >
              <span>Experiences</span>
              <Icon
                name={experiencesOpen ? 'chevronUp' : 'chevronDown'}
                className="w-3.5 h-3.5 text-[#6B6B73]"
              />
            </button>
          </div>

          {experiencesOpen && (
            <div className="space-y-0.5 animate-fade-in pl-1">
              {experienceItems.map((item) => {
                const isActive = isExperienceActive(item.href);

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#EEEAFE] text-[#6C63FF] font-bold'
                        : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        name={item.icon}
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#6C63FF]' : 'text-[#6B6B73]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.tag && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? 'bg-[#6C63FF] text-white'
                          : 'bg-[#F1F0EC] text-[#6B6B73]'
                      }`}>
                        {item.tag}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Secondary Preferences & AI Tools */}
        <div className="pt-2 border-t border-[#E7E5E0] space-y-1">
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#6B6B73]">
            Tools &amp; Settings
          </p>
          {secondaryNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#EEEAFE] text-[#6C63FF] font-bold shadow-xs'
                    : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  name={item.icon}
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#6C63FF]' : 'text-[#6B6B73]'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Admin Switcher & User Footer */}
      <div className="p-3 border-t border-[#E7E5E0] space-y-2.5 bg-white">
        {user?.role === 'admin' && (
          <Link
            href={ROUTES.ADMIN.DASHBOARD}
            className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6C63FF] hover:bg-[#EEEAFE] border border-[#6C63FF]/20 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Icon name="shield" className="w-4 h-4 text-[#6C63FF]" />
              Admin Console
            </span>
            <span className="text-[10px] uppercase font-bold text-[#6C63FF] bg-[#EEEAFE] px-1.5 py-0.5 rounded">
              Portal
            </span>
          </Link>
        )}

        {/* User Identity Card & Logout */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0]">
          <Link
            href={ROUTES.USER.PROFILE}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
          >
            <Avatar name={user?.fullName || 'Guest User'} src={user?.profile?.avatarUrl} size="sm" status={user ? 'online' : 'offline'} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1E1E24] truncate">
                {user?.fullName || 'Guest User'}
              </p>
              <p className="text-[11px] text-[#6B6B73] truncate font-mono">
                {user ? `@${user.email?.split('@')[0]}` : 'Active Session'}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-[#6B6B73] hover:text-[#FF6B6B] rounded-lg hover:bg-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#FF6B6B]"
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
