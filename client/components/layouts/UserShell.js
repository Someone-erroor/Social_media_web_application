import Link from 'next/link';
import UserSidebar from '@/components/navigation/UserSidebar';
import UserHeader from '@/components/navigation/UserHeader';
import UserBottomNav from '@/components/navigation/UserBottomNav';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';

/**
 * UserShell Layout Component for Looply
 * Modern 3-column layout on desktop, responsive top header and bottom nav on mobile.
 */
export default function UserShell({ children, showSidePanel = true }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Desktop Left Sidebar Navigation */}
      <UserSidebar />

      {/* Main Experience Column (Offset by sidebar width on desktop) */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
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
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
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
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
                          {item.topic}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.posts}
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Assistant Teaser Card */}
                <Card className="bg-linear-to-br from-indigo-50/50 via-white to-purple-50/50 border-indigo-100">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center gap-2 text-indigo-700">
                      <Icon name="sparkles" className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        AI Assistant
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Brainstorm posts, rewrite drafts, and summarize discussion threads with Looply AI.
                    </p>
                    <Link
                      href={ROUTES.USER.ASSISTANT}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <span>Explore Assistant</span>
                      <Icon name="chevronRight" className="w-3.5 h-3.5" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Community Guidelines Card */}
                <div className="px-3 text-xs text-slate-400 space-y-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link href={ROUTES.PUBLIC.HOME} className="hover:underline">
                      About Looply
                    </Link>
                    <Link href={ROUTES.USER.SETTINGS} className="hover:underline">
                      Settings
                    </Link>
                    <Link href={ROUTES.ADMIN.DASHBOARD} className="hover:underline">
                      Admin Portal
                    </Link>
                  </div>
                  <p>&copy; 2026 Looply. Connect. Share. Express.</p>
                </div>
              </aside>
            )}
          </div>
        </main>

        {/* Mobile Fixed Bottom Navigation */}
        <UserBottomNav />
      </div>
    </div>
  );
}
