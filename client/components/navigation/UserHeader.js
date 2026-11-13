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
 * Top Header for User Experience (Warm Social Playground Theme)
 * White background (#FFFFFF/95), search pill, notification pill with warm coral (#FF6B6B),
 * and clean accessible user profile dropdown with Admin Console link.
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
    <header className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur-md border-b border-[#E7E5E0]">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Mobile Logo: links strictly to Feed */}
        <div className="md:hidden flex items-center">
          <Logo size="small" showTagline={false} href={ROUTES.USER.FEED} />
        </div>

        {/* Global Explore Shortcut */}
        <div className="flex-1 max-w-md hidden sm:block">
          <Link
            href={ROUTES.USER.EXPLORE}
            className="flex items-center gap-2.5 w-full rounded-full border border-[#E7E5E0] bg-[#F8F7F4] hover:bg-[#F1F0EC] hover:border-[#6C63FF]/40 px-4 py-1.5 text-xs text-[#6B6B73] hover:text-[#1E1E24] transition-all shadow-inner group"
          >
            <Icon name="search" className="w-4 h-4 text-[#6C63FF] group-hover:scale-110 transition-transform" />
            <span className="font-medium">Explore posts, topics, and creators...</span>
          </Link>
        </div>

        {/* Quick Actions & Profile Dropdown */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Admin Activity Shortcut Button */}
          <Link
            href={ROUTES.ADMIN.DASHBOARD}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#6C63FF] bg-[#EEEAFE] border border-[#6C63FF]/20 hover:bg-[#6C63FF] hover:text-white transition-all shadow-xs"
            title="Looply Platform Administration Console"
          >
            <Icon name="shield" className="w-3.5 h-3.5 shrink-0 text-[#6C63FF] group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">Admin</span>
            {user?.role === 'admin' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF78] group-hover:bg-white animate-pulse" />
            ) : (
              <span className="text-[10px] text-[#6B6B73] group-hover:text-white/80 font-mono">Portal</span>
            )}
          </Link>

          <Link
            href={ROUTES.USER.NOTIFICATIONS}
            className="p-2 rounded-full text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC] transition-colors relative"
            aria-label="View notifications"
          >
            <Icon name="notifications" className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-[#FF6B6B] rounded-full animate-badge-pulse shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#6C63FF]/30 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] transition-all min-w-[28px] min-h-[28px] cursor-pointer"
              aria-label={`${initials} - ${displayName} Menu`}
              aria-haspopup="menu"
              aria-expanded={dropdownOpen}
            >
              <Avatar name={displayName} src={user?.profile?.avatarUrl} size="sm" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#E7E5E0] shadow-xl py-1.5 z-50 animate-fade-in"
                role="menu"
                aria-label="User profile menu"
              >
                {/* User Identity Banner */}
                <div className="px-3.5 py-2.5 border-b border-[#E7E5E0]">
                  <p className="text-xs font-bold text-[#1E1E24] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#6B6B73] truncate font-mono">
                    {user ? `@${user.email?.split('@')[0]}` : 'Active Session'}
                  </p>
                </div>

                {/* Primary Navigation Links */}
                <div className="py-1">
                  <Link
                    href={ROUTES.USER.PROFILE}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC] transition-colors"
                    role="menuitem"
                  >
                    <Icon name="profile" className="w-4 h-4 text-[#6C63FF]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href={ROUTES.USER.PLAY}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC] transition-colors"
                    role="menuitem"
                  >
                    <Icon name="play" className="w-4 h-4 text-[#FFD166]" />
                    <span>Play Arcade</span>
                  </Link>

                  <Link
                    href={ROUTES.USER.EXPERIENCES}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC] transition-colors"
                    role="menuitem"
                  >
                    <Icon name="experiences" className="w-4 h-4 text-[#6C63FF]" />
                    <span>Experiences Hub</span>
                  </Link>

                  <Link
                    href={ROUTES.USER.SETTINGS}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC] transition-colors"
                    role="menuitem"
                  >
                    <Icon name="settings" className="w-4 h-4 text-[#6B6B73]" />
                    <span>Settings</span>
                  </Link>

                  {/* Conditional Admin Console Link */}
                  {user?.role === 'admin' && (
                    <Link
                      href={ROUTES.ADMIN.DASHBOARD}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-[#6C63FF] hover:bg-[#EEEAFE] transition-colors border-t border-[#E7E5E0]"
                      role="menuitem"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon name="shield" className="w-4 h-4 text-[#6C63FF]" />
                        Admin Console
                      </span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20">
                        Admin
                      </span>
                    </Link>
                  )}
                </div>

                {/* Sign Out Action */}
                <div className="pt-1 border-t border-[#E7E5E0]">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#FF6B6B] hover:bg-[#FFEAEA] transition-colors text-left font-semibold cursor-pointer"
                    role="menuitem"
                  >
                    <Icon name="close" className="w-4 h-4 text-[#FF6B6B]" />
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
