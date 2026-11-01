'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * Public Navigation Bar for Looply Landing Page
 * Full responsive navigation with desktop links and mobile drawer.
 */
export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E3E8E8] bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Logo showTagline={false} href={ROUTES.PUBLIC.HOME} />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#252E34]" aria-label="Main Navigation">
          <a href="#features" className="hover:text-[#087F8A] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[#087F8A] transition-colors">
            How It Works
          </a>
          <a href="#community" className="hover:text-[#087F8A] transition-colors">
            Community
          </a>
          <Link href={ROUTES.USER.FEED} className="hover:text-[#087F8A] transition-colors">
            Feed
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            href={ROUTES.PUBLIC.LOGIN}
            variant="ghost"
            size="sm"
          >
            Sign In
          </Button>
          <Button
            href={ROUTES.PUBLIC.REGISTER}
            variant="primary"
            size="sm"
          >
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            className="p-2 rounded-lg text-[#252E34] hover:text-[#172126] hover:bg-[#F6F8F7] focus:outline-none focus:ring-2 focus:ring-[#16B8C8]"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E3E8E8] bg-white px-4 pt-3 pb-6 space-y-4 shadow-lg">
          <nav className="flex flex-col space-y-2 text-base font-medium text-[#252E34]" aria-label="Mobile Navigation">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#F6F8F7] hover:text-[#087F8A]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#F6F8F7] hover:text-[#087F8A]"
            >
              How It Works
            </a>
            <a
              href="#community"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#F6F8F7] hover:text-[#087F8A]"
            >
              Community
            </a>
            <Link
              href={ROUTES.USER.FEED}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#F6F8F7] hover:text-[#087F8A]"
            >
              Feed
            </Link>
          </nav>

          <div className="pt-3 border-t border-[#E3E8E8] flex flex-col gap-2.5">
            <Button
              href={ROUTES.PUBLIC.LOGIN}
              variant="outline"
              size="md"
              className="w-full justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Button>
            <Button
              href={ROUTES.PUBLIC.REGISTER}
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Free Account
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

