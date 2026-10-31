import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { ROUTES } from '@/lib/routes';

/**
 * Public Footer Component for Looply
 * Modern footer with platform links, copyright, and architectural status.
 */
export default function PublicFooter() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-3">
            <Logo size="default" showTagline={true} href={ROUTES.PUBLIC.HOME} />
            <p className="text-xs text-slate-500 leading-relaxed">
              A modern, authentic social network built for meaningful connections and creative expression.
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href={ROUTES.USER.FEED} className="hover:text-indigo-600 transition-colors">
                  Social Feed
                </Link>
              </li>
              <li>
                <Link href={ROUTES.USER.EXPLORE} className="hover:text-indigo-600 transition-colors">
                  Explore Topics
                </Link>
              </li>
              <li>
                <Link href={ROUTES.USER.ASSISTANT} className="hover:text-indigo-600 transition-colors">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ADMIN.DASHBOARD} className="hover:text-indigo-600 transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Authentication Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Account
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link href={ROUTES.PUBLIC.LOGIN} className="hover:text-indigo-600 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href={ROUTES.PUBLIC.REGISTER} className="hover:text-indigo-600 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href={ROUTES.PUBLIC.FORGOT_PASSWORD} className="hover:text-indigo-600 transition-colors">
                  Password Recovery
                </Link>
              </li>
              <li>
                <Link href={ROUTES.PUBLIC.VERIFY_EMAIL} className="hover:text-indigo-600 transition-colors">
                  Email Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Status Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
              Platform Status
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-2">
              Next-generation social interface and navigation systems active.
            </p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Systems Operational
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; 2026 Looply. All rights reserved. Connect. Share. Express.
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-700 cursor-default">Privacy Policy</span>
            <span className="hover:text-slate-700 cursor-default">Terms of Service</span>
            <span className="hover:text-slate-700 cursor-default">Community Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
