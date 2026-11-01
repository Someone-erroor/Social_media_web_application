import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { ROUTES } from '@/lib/routes';

/**
 * Public Footer Component for Looply (Dark Neon Theme)
 * Modern dark footer with platform links, copyright, and architectural status.
 */
export default function PublicFooter() {
  return (
    <footer className="w-full border-t border-[#263640] bg-[#080D12] text-[#F4F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-3">
            <Logo size="default" showTagline={true} href={ROUTES.PUBLIC.HOME} />
            <p className="text-xs text-[#9BAAB4] leading-relaxed">
              A modern, authentic social network built for meaningful connections and creative expression.
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F8FA] mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-[#9BAAB4]">
              <li>
                <Link href={ROUTES.USER.FEED} className="hover:text-[#19D3E3] transition-colors">
                  Social Feed
                </Link>
              </li>
              <li>
                <Link href={ROUTES.USER.EXPLORE} className="hover:text-[#19D3E3] transition-colors">
                  Explore Topics
                </Link>
              </li>
              <li>
                <Link href={ROUTES.USER.ASSISTANT} className="hover:text-[#19D3E3] transition-colors">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ADMIN.DASHBOARD} className="hover:text-[#19D3E3] transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Authentication Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F8FA] mb-3">
              Account
            </h4>
            <ul className="space-y-2 text-xs text-[#9BAAB4]">
              <li>
                <Link href={ROUTES.PUBLIC.LOGIN} className="hover:text-[#19D3E3] transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href={ROUTES.PUBLIC.REGISTER} className="hover:text-[#19D3E3] transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href={ROUTES.PUBLIC.FORGOT_PASSWORD} className="hover:text-[#19D3E3] transition-colors">
                  Reset Password
                </Link>
              </li>
            </ul>
          </div>

          {/* Architectural Telemetry Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F8FA] mb-3">
              Platform Status
            </h4>
            <div className="space-y-2 text-xs text-[#9BAAB4]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#32D583]" />
                <span className="text-[#32D583] font-medium">Systems Operational</span>
              </div>
              <p className="text-[11px] text-[#9BAAB4]">
                Next.js App Router &bull; Express REST API &bull; Socket.IO &bull; Gemini 3.8 Flash
              </p>
              <div className="pt-2">
                <span className="inline-block px-2 py-0.5 text-[10px] font-mono text-[#19D3E3] bg-[#151F29] border border-[#263640] rounded">
                  Looply Core Platform &bull; v1.0.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#263640] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9BAAB4]">
          <p>&copy; {new Date().getFullYear()} Looply. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href={ROUTES.PUBLIC.PRIVACY} className="hover:text-[#19D3E3] transition-colors">
              Privacy Policy
            </Link>
            <Link href={ROUTES.PUBLIC.TERMS} className="hover:text-[#19D3E3] transition-colors">
              Terms of Service
            </Link>
            <a href="/#community" className="hover:text-[#19D3E3] transition-colors">
              Community Guidelines
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
