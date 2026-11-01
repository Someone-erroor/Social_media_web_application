'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { ROUTES } from '@/lib/routes';

/**
 * Top Header for User Experience (Dark Neon Theme)
 * Dark graphite background (#101A22), neon search bar, coral notification pill,
 * and accessible user profile dropdown with responsive Admin Console link.
 */
export default function UserHeader() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const getInitials = (text) => {
    if (!text) return 'GU';
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.fullName || 'Guest User';
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-20 w-full bg-[#101A22]/95 backdrop-blur-md border-b border-[#263640]">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Mobile Logo: links strictly to Feed */}
        <div className="md:hidden flex items-center">
          <Logo size="small" showTagline={false} href={ROUTES.USER.FEED} />
        </div>

        {/* Global Explore Shortcut */}
        <div className="flex-1 max-w-md hidden sm:block">
          <Link
            href={ROUTES.USER.EXPLORE}
            className="flex items-center gap-2.5 w-full rounded-full border border-[#263640] bg-[#151F29] hover:bg-[#1D2A35] hover:border-[#19D3E3] px-4 py-1.5 text-xs text-[#9BAAB4] hover:text-[#F4F8FA] transition-all shadow-inner group"
          >
            <Icon name="search" className="w-4 h-4 text-[#19D3E3] transition-colors" />
            <span className="font-medium">Explore posts, topics, and community creators...</span>
          </Link>
        </div>

        {/* Quick Actions & Profile Dropdown */}
        <div className="flex items-center gap-3 ml-auto">
          <Link
            href={ROUTES.USER.NOTIFICATIONS}
            className="p-2 rounded-full text-[#9BAAB4] hover:text-[#19D3E3] hover:bg-[#151F29] transition-colors relative"
            aria-label="View notifications"
          >
            <Icon name="notifications" className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-[#FF6F61] rounded-full animate-badge-pulse shadow-xs shadow-[#FF6F61]/50">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#19D3E3]/40 focus:outline-none focus:ring-2 focus:ring-[#19D3E3] transition-all min-w-[28px] min-h-[28px]"
              aria-label={`${initials} - ${displayName} Menu`}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
            >
              <Avatar name={displayName} src={user?.profile?.avatarUrl} size="sm" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#151F29] border border-[#263640] shadow-xl shadow-black/50 py-1.5 z-50 animate-fade-in"
                role="menu"
                aria-label="User profile menu"
              >
                {/* User Identity Banner */}
                <div className="px-3.5 py-2.5 border-b border-[#263640]">
                  <p className="text-xs font-semibold text-[#F4F8FA] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#9BAAB4] truncate font-mono">
                    {user ? `@${user.email?.split('@')[0]}` : 'Active Session'}
                  </p>
                </div>

                {/* Primary Navigation Links */}
                <div className="py-1">
                  <Link
                    href={ROUTES.USER.PROFILE}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#9BAAB4] hover:text-[#F4F8FA] hover:bg-[#1D2A35] transition-colors"
                    role="menuitem"
                  >
                    <Icon name="profile" className="w-4 h-4 text-[#19D3E3]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href={ROUTES.USER.SETTINGS}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#9BAAB4] hover:text-[#F4F8FA] hover:bg-[#1D2A35] transition-colors"
                    role="menuitem"
                  >
                    <Icon name="settings" className="w-4 h-4 text-[#19D3E3]" />
                    <span>Settings</span>
                  </Link>

                  {/* Conditional Admin Console Link */}
                  {user?.role === 'admin' && (
                    <Link
                      href={ROUTES.ADMIN.DASHBOARD}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2 text-xs font-medium text-[#19D3E3] hover:bg-[#1D2A35] transition-colors border-t border-[#263640]/50"
                      role="menuitem"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon name="shield" className="w-4 h-4 text-[#19D3E3]" />
                        Admin Console
                      </span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#19D3E3]/15 text-[#19D3E3] border border-[#19D3E3]/30">
                        Admin
                      </span>
                    </Link>
                  )}
                </div>

                {/* Sign Out Action */}
                <div className="pt-1 border-t border-[#263640]">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#FF6F61] hover:bg-[#FF6F61]/10 transition-colors text-left"
                    role="menuitem"
                  >
                    <Icon name="close" className="w-4 h-4 text-[#FF6F61]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
