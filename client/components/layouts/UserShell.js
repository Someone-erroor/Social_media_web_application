'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import UserSidebar from '@/components/navigation/UserSidebar';
import UserHeader from '@/components/navigation/UserHeader';
import UserBottomNav from '@/components/navigation/UserBottomNav';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * UserShell Layout Component for Looply (Editorial Expression Theme)
 * Modern 3-column layout on desktop, responsive top header and bottom nav on mobile.
 * Deep Midnight Ink background (#110F17), elevated cards (#1E1B26), Electric Coral & Soft Lavender accents.
 */
export default function UserShell({ children, showSidePanel = true }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(ROUTES.PUBLIC.LOGIN);
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#110F17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#2D2938] border-t-[#FF6257] rounded-full animate-spin" />
          <p className="text-xs text-[#777580] font-medium tracking-wide">Loading Looply...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#110F17] text-[#F6F2EA] flex flex-col antialiased overflow-x-hidden selection:bg-[#FF6257] selection:text-[#17151D]">
      {/* Desktop Left Sidebar Navigation */}
      <UserSidebar />

      {/* Main Experience Column (Offset by sidebar width on desktop) */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 overflow-x-hidden">
        <UserHeader />

        {/* Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-8 justify-center items-start">
            {/* Primary Center Content Column */}
            <div className="w-full max-w-2xl min-w-0 pb-20 md:pb-8">
              {children}
            </div>

            {/* Desktop Right Contextual Side Panel */}
            {showSidePanel && (
              <aside
                className="hidden lg:block w-72 xl:w-80 shrink-0 space-y-5 sticky top-24"
                aria-label="Contextual Side Panel"
              >
                {/* Explore Topics Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Discover Topics</CardTitle>
                      <Link
                        href={ROUTES.USER.EXPLORE}
                        className="text-xs font-semibold text-[#FF6257] hover:text-[#FF8178] transition-colors"
                      >
                        view all
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { topic: '#DesignSystems', posts: 'Trending' },
                      { topic: '#NextJsAppRouter', posts: 'Active' },
                      { topic: '#WebEngineering', posts: 'Trending' },
                      { topic: '#AIAssistant', posts: 'Curated' }
                    ].map((item) => (
                      <Link
                        key={item.topic}
                        href={ROUTES.USER.EXPLORE}
                        className="flex items-center justify-between group py-1"
                      >
                        <span className="text-sm font-medium text-[#F6F2EA] group-hover:text-[#FF6257] transition-colors">
                          {item.topic}
                        </span>
                        <span className="text-[11px] text-[#777580] font-medium">
                          {item.posts}
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Assistant Teaser Card */}
                <Card className="bg-gradient-to-br from-[#1E1B26] via-[#24202E] to-[#1E1B26] border border-[#B9A8F5]/30 shadow-lg shadow-[#B9A8F5]/5">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center gap-2 text-[#B9A8F5]">
                      <Icon name="sparkles" className="w-5 h-5 text-[#B9A8F5]" />
                      <span className="text-xs font-bold uppercase tracking-wider font-display">
                        AI Assistant
                      </span>
                    </div>
                    <p className="text-xs text-[#777580] leading-relaxed">
                      Brainstorm posts, rewrite drafts, and summarize discussion threads with Google Gemini AI.
                    </p>
                    <Link
                      href={ROUTES.USER.ASSISTANT}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B9A8F5] hover:text-[#D5F36A] transition-colors"
                    >
                      <span>Explore Assistant</span>
                      <Icon name="chevronRight" className="w-3.5 h-3.5" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Community Guidelines Card */}
                <div className="px-3 text-xs text-[#777580] space-y-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link href={ROUTES.PUBLIC.HOME} className="hover:underline hover:text-[#F6F2EA] text-[#777580]">
                      About Looply
                    </Link>
                    <span>&bull;</span>
                    <Link href={ROUTES.PUBLIC.PRIVACY} className="hover:underline hover:text-[#F6F2EA] text-[#777580]">
                      Privacy
                    </Link>
                    <span>&bull;</span>
                    <Link href={ROUTES.PUBLIC.TERMS} className="hover:underline hover:text-[#F6F2EA] text-[#777580]">
                      Terms
                    </Link>
                  </div>
                  <p className="text-[11px] text-[#777580]">
                    &copy; {new Date().getFullYear()} Looply. Connect. Share. Express.
                  </p>
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <UserBottomNav />
    </div>
  );
}
