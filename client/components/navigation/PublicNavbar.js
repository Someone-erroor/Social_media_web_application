'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * Public Navigation Bar for Looply Landing Page (Light-First Social Playground)
 * Crisp white surface (#FFFFFF/90), hairline border (#E7E5E0), Brand Purple (#6C63FF) and Coral (#FF6B6B) accents.
 */
export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E7E5E0] bg-[#FFFFFF]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Logo showTagline={false} href={ROUTES.PUBLIC.HOME} />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B6B73]" aria-label="Main Navigation">
          <Link href="/#features" className="hover:text-[#1E1E24] transition-colors">
            Features
          </Link>
          <Link href="/#how-it-works" className="hover:text-[#1E1E24] transition-colors">
            How It Works
          </Link>
          <Link href="/#community" className="hover:text-[#1E1E24] transition-colors">
            Community
          </Link>
          <Link href={ROUTES.USER.FEED} className="hover:text-[#1E1E24] transition-colors flex items-center gap-1.5 font-semibold text-[#1E1E24]">
            <span>Feed</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B6B] animate-pulse" />
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login?admin=true"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6C63FF] bg-[#EEEAFE] border border-[#6C63FF]/20 hover:bg-[#6C63FF] hover:text-white transition-all shadow-xs"
            title="Administrator Portal Access"
          >
            <Icon name="shield" className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

          <Button
            href={ROUTES.PUBLIC.LOGIN}
            variant="ghost"
            size="sm"
            className="text-[#1E1E24] hover:bg-[#F1F0EC]"
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
            className="p-2 rounded-lg text-[#6B6B73] hover:text-[#1E1E24] hover:bg-[#F1F0EC] focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
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
        <div className="md:hidden border-b border-[#E7E5E0] bg-[#FFFFFF] px-4 pt-3 pb-6 space-y-4 shadow-xl animate-fade-in">
          <nav className="flex flex-col space-y-2 text-base font-medium text-[#1E1E24]" aria-label="Mobile Navigation">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#6C63FF] transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#6C63FF] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#community"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#6C63FF] transition-colors"
            >
              Community
            </Link>
            <Link
              href={ROUTES.USER.FEED}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#6C63FF] transition-colors flex items-center justify-between"
            >
              <span>Explore Live Feed</span>
              <span className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
            </Link>
          </nav>

          <div className="pt-4 border-t border-[#E7E5E0] flex flex-col gap-2">
            <Link
              href="/login?admin=true"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl bg-[#EEEAFE] border border-[#6C63FF]/30 text-[#6C63FF] hover:bg-[#6C63FF] hover:text-white transition-colors flex items-center justify-center gap-2 text-xs font-bold"
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
