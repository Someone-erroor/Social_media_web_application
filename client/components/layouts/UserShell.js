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
 * UserShell Layout Component for Looply (Warm Social Playground Theme)
 * Modern 3-column layout on desktop, responsive top header and bottom nav on mobile.
 * Warm light ivory floor (#F8F7F4), crisp white cards (#FFFFFF), Brand Purple & Soft Lavender accents.
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
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#E7E5E0] border-t-[#6C63FF] rounded-full animate-spin" />
          <p className="text-xs text-[#6B6B73] font-medium tracking-wide">Loading Looply...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1E1E24] flex flex-col antialiased overflow-x-hidden selection:bg-[#EEEAFE] selection:text-[#6C63FF]">
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
                        className="text-xs font-semibold text-[#6C63FF] hover:underline transition-colors"
                      >
                        view all
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { topic: '#DesignPlayground', posts: 'Trending' },
                      { topic: '#SplitReality', posts: 'Signature' },
                      { topic: '#CommunityQuests', posts: 'Active' },
                      { topic: '#AIAssistant', posts: 'Curated' }
                    ].map((item) => (
                      <Link
                        key={item.topic}
                        href={ROUTES.USER.EXPLORE}
                        className="flex items-center justify-between group py-1"
                      >
                        <span className="text-sm font-medium text-[#1E1E24] group-hover:text-[#6C63FF] transition-colors">
                          {item.topic}
                        </span>
                        <span className="text-[11px] text-[#6B6B73] font-medium bg-[#F1F0EC] px-2 py-0.5 rounded-full">
                          {item.posts}
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                {/* Experiences Spotlight Card */}
                <Card className="hover:border-[#6C63FF]/30 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="experiences" className="w-4 h-4 text-[#6C63FF]" />
                        <CardTitle>Experiences</CardTitle>
                      </div>
                      <Link
                        href={ROUTES.USER.EXPERIENCES}
                        className="text-xs font-semibold text-[#6C63FF] hover:underline transition-colors"
                      >
                        view hub &rarr;
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-1">
                    {[
                      { name: 'Split-Reality', tag: 'Dual', href: ROUTES.USER.FEED },
                      { name: 'Play Arcade', tag: 'Games', href: ROUTES.USER.PLAY },
                      { name: 'Mood-Orbit', tag: 'Live Chat', href: ROUTES.USER.MOOD_ORBIT },
                      { name: 'Time Capsules', tag: 'Vaults', href: ROUTES.USER.TIME_CAPSULE }
                    ].map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center justify-between group py-1 text-xs"
                      >
                        <span className="font-semibold text-[#1E1E24] group-hover:text-[#6C63FF] transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#6B6B73] group-hover:text-[#6C63FF] font-mono transition-colors bg-[#F1F0EC] px-1.5 py-0.5 rounded">
                          {item.tag}
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Assistant Teaser Card */}
                <div className="p-5 rounded-2xl bg-[#EEEAFE] border border-[#6C63FF]/20 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2 text-[#6C63FF]">
                    <Icon name="sparkles" className="w-5 h-5 text-[#6C63FF]" />
                    <span className="text-xs font-bold uppercase tracking-wider font-display">
                      AI Assistant
                    </span>
                  </div>
                  <p className="text-xs text-[#1E1E24]/80 leading-relaxed">
                    Brainstorm posts, rewrite drafts, and summarize discussion threads with Google Gemini AI.
                  </p>
                  <Link
                    href={ROUTES.USER.ASSISTANT}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6C63FF] hover:underline transition-colors"
                  >
                    <span>Open Assistant</span>
                    <Icon name="chevronRight" className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Community Guidelines Card */}
                <div className="px-3 text-xs text-[#6B6B73] space-y-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link href={ROUTES.PUBLIC.HOME} className="hover:underline hover:text-[#1E1E24] text-[#6B6B73]">
                      About Looply
                    </Link>
                    <span>&bull;</span>
                    <Link href={ROUTES.PUBLIC.PRIVACY} className="hover:underline hover:text-[#1E1E24] text-[#6B6B73]">
                      Privacy
                    </Link>
                    <span>&bull;</span>
                    <Link href={ROUTES.PUBLIC.TERMS} className="hover:underline hover:text-[#1E1E24] text-[#6B6B73]">
                      Terms
                    </Link>
                  </div>
                  <p className="text-[11px] text-[#6B6B73]">
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
