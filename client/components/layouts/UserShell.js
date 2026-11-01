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
 * UserShell Layout Component for Looply (Dark Neon Theme)
 * Modern 3-column layout on desktop, responsive top header and bottom nav on mobile.
 * Deep dark background (#080D12), elevated dark cards (#151F29), electric cyan accents.
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
      <div className="min-h-screen bg-[#080D12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#263640] border-t-[#19D3E3] rounded-full animate-spin" />
          <p className="text-xs text-[#9BAAB4] font-medium">Loading Looply...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#080D12] text-[#F4F8FA] flex flex-col antialiased overflow-x-hidden">
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
                        className="text-xs font-semibold text-[#19D3E3] hover:text-[#00B8C8] transition-colors"
                      >
                        View all
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
                        <span className="text-sm font-medium text-[#F4F8FA] group-hover:text-[#19D3E3] transition-colors">
                          {item.topic}
                        </span>
                        <span className="text-[11px] text-[#9BAAB4] font-medium">
                          {item.posts}
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Assistant Teaser Card */}
                <Card className="bg-gradient-to-br from-[#151F29] via-[#1D2A35] to-[#151F29] border border-[#19D3E3]/30 shadow-lg shadow-[#19D3E3]/5">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center gap-2 text-[#19D3E3]">
                      <Icon name="sparkles" className="w-5 h-5 text-[#19D3E3]" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        AI Assistant
                      </span>
                    </div>
                    <p className="text-xs text-[#9BAAB4] leading-relaxed">
                      Brainstorm posts, rewrite drafts, and summarize discussion threads with Google Gemini AI.
                    </p>
                    <Link
                      href={ROUTES.USER.ASSISTANT}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#19D3E3] hover:text-[#00B8C8] transition-colors"
                    >
                      <span>Explore Assistant</span>
                      <Icon name="chevronRight" className="w-3.5 h-3.5" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Community Guidelines Card */}
                <div className="px-3 text-xs text-[#9BAAB4] space-y-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link href={ROUTES.PUBLIC.HOME} className="hover:underline hover:text-[#F4F8FA] text-[#9BAAB4]">
                      About Looply
                    </Link>
                    <span>&bull;</span>
                    <Link href={ROUTES.PUBLIC.PRIVACY} className="hover:underline hover:text-[#F4F8FA] text-[#9BAAB4]">
                      Privacy
                    </Link>
                    <span>&bull;</span>
                    <Link href={ROUTES.PUBLIC.TERMS} className="hover:underline hover:text-[#F4F8FA] text-[#9BAAB4]">
                      Terms
                    </Link>
                  </div>
                  <p className="text-[11px] text-[#9BAAB4]">
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
