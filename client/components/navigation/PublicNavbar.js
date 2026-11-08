'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * Public Navigation Bar for Looply Landing Page (Editorial Expression Theme)
 * Midnight Ink background (#110F17/90), hairline border (#2D2938), Electric Coral and Soft Lavender accents.
 */
export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2D2938] bg-[#110F17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Logo showTagline={false} href={ROUTES.PUBLIC.HOME} />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#777580]" aria-label="Main Navigation">
          <Link href="/#features" className="hover:text-[#F6F2EA] transition-colors">
            Features
          </Link>
          <Link href="/#how-it-works" className="hover:text-[#F6F2EA] transition-colors">
            How It Works
          </Link>
          <Link href="/#community" className="hover:text-[#F6F2EA] transition-colors">
            Community
          </Link>
          <Link href={ROUTES.USER.FEED} className="hover:text-[#F6F2EA] transition-colors flex items-center gap-1.5">
            <span>Feed</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6257] animate-pulse" />
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login?admin=true"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#B9A8F5] bg-[#1E1B26] border border-[#B9A8F5]/40 hover:bg-[#B9A8F5] hover:text-[#17151D] transition-all shadow-xs"
            title="Administrator Portal Access"
          >
            <Icon name="shield" className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

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
            className="p-2 rounded-lg text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26] focus:outline-none focus:ring-2 focus:ring-[#FF6257]"
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
        <div className="md:hidden border-b border-[#2D2938] bg-[#17151D] px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-fade-in">
          <nav className="flex flex-col space-y-2 text-base font-medium text-[#F6F2EA]" aria-label="Mobile Navigation">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#1E1B26] hover:text-[#FF6257] transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#1E1B26] hover:text-[#FF6257] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#community"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#1E1B26] hover:text-[#FF6257] transition-colors"
            >
              Community
            </Link>
            <Link
              href={ROUTES.USER.FEED}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#1E1B26] hover:text-[#FF6257] transition-colors flex items-center justify-between"
            >
              <span>Explore Live Feed</span>
              <span className="w-2 h-2 rounded-full bg-[#FF6257]" />
            </Link>
          </nav>

          <div className="pt-4 border-t border-[#2D2938] flex flex-col gap-2">
            <Link
              href="/login?admin=true"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl bg-[#1E1B26] border border-[#B9A8F5]/40 text-[#B9A8F5] hover:bg-[#B9A8F5] hover:text-[#17151D] transition-colors flex items-center justify-center gap-2 text-xs font-bold"
            >
              <Icon name="shield" className="w-4 h-4" />
              <span>Admin Portal Access</span>
            </Link>
            <Button
              href={ROUTES.PUBLIC.REGISTER}
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Account
            </Button>
            <Button
              href={ROUTES.PUBLIC.LOGIN}
              variant="outline"
              size="md"
              className="w-full justify-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
