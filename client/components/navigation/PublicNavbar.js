'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * Public Navigation Bar for Looply Landing Page (Dark Neon Theme)
 * Dark translucent graphite background (#080D12/90), neon cyan accents, coral details.
 */
export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#263640] bg-[#080D12]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Logo showTagline={false} href={ROUTES.PUBLIC.HOME} />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9BAAB4]" aria-label="Main Navigation">
          <Link href="/#features" className="hover:text-[#19D3E3] transition-colors">
            Features
          </Link>
          <Link href="/#how-it-works" className="hover:text-[#19D3E3] transition-colors">
            How It Works
          </Link>
          <Link href="/#community" className="hover:text-[#19D3E3] transition-colors">
            Community
          </Link>
          <Link href={ROUTES.USER.FEED} className="hover:text-[#19D3E3] transition-colors flex items-center gap-1.5">
            <span>Feed</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6F61]" />
          </Link>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login?admin=true"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#19D3E3] bg-[#151F29] border border-[#19D3E3]/40 hover:bg-[#19D3E3] hover:text-[#080D12] transition-all shadow-xs"
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
            className="p-2 rounded-lg text-[#9BAAB4] hover:text-[#F4F8FA] hover:bg-[#151F29] focus:outline-none focus:ring-2 focus:ring-[#19D3E3]"
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
        <div className="md:hidden border-b border-[#263640] bg-[#101A22] px-4 pt-3 pb-6 space-y-4 shadow-2xl animate-fade-in">
          <nav className="flex flex-col space-y-2 text-base font-medium text-[#F4F8FA]" aria-label="Mobile Navigation">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151F29] hover:text-[#19D3E3] transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151F29] hover:text-[#19D3E3] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#community"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151F29] hover:text-[#19D3E3] transition-colors"
            >
              Community
            </Link>
            <Link
              href={ROUTES.USER.FEED}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151F29] hover:text-[#19D3E3] transition-colors flex items-center justify-between"
            >
              <span>Explore Live Feed</span>
              <span className="w-2 h-2 rounded-full bg-[#FF6F61]" />
            </Link>
          </nav>

          <div className="pt-4 border-t border-[#263640] flex flex-col gap-2">
            <Link
              href="/login?admin=true"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl bg-[#151F29] border border-[#19D3E3]/40 text-[#19D3E3] hover:bg-[#19D3E3] hover:text-[#080D12] transition-colors flex items-center justify-center gap-2 text-xs font-bold"
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
