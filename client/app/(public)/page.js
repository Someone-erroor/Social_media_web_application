import Link from 'next/link';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import PublicFooter from '@/components/navigation/PublicFooter';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Connect. Share. Express.',
  description: 'A modern, authentic social network built for meaningful connections and creative expression.'
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F7] antialiased selection:bg-[#16B8C8] selection:text-[#172126]">
      {/* Responsive Public Navigation */}
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-linear-to-b from-white via-[#F6F8F7]/50 to-[#F6F8F7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/60 shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-[#16B8C8]"></span>
                <span className="text-xs font-semibold text-[#087F8A] tracking-wide uppercase">
                  A New Era of Authentic Social Interaction
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#172126] tracking-tight leading-none">
                Connect authentically.{' '}
                <span className="bg-linear-to-r from-[#16B8C8] via-[#087F8A] to-[#FF725E] bg-clip-text text-transparent">
                  Share your voice.
                </span>{' '}
                Express who you are.
              </h1>

              <p className="text-base sm:text-lg text-[#252E34] max-w-2xl mx-auto leading-relaxed">
                Looply is the modern social network where authentic dialogue thrives.
                Connect with communities, share rich posts, and amplify your thoughts
                with intelligent AI assistance.
              </p>

              {/* Hero Call-to-Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Button
                  href={ROUTES.PUBLIC.REGISTER}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-md"
                >
                  Create Account
                </Button>
                <Button
                  href={ROUTES.PUBLIC.LOGIN}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/80"
                >
                  Sign In
                </Button>
                <Button
                  href={ROUTES.USER.FEED}
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Explore Community Feed &rarr;
                </Button>
              </div>

              <div className="pt-2 text-xs text-[#58666D] flex items-center justify-center gap-4">
                <span>&bull; No predatory algorithms</span>
                <span>&bull; Full privacy controls</span>
                <span>&bull; AI-assisted workflows</span>
              </div>
            </div>

            {/* Product UI Mockup Card Preview */}
            <div className="mt-14 max-w-4xl mx-auto">
              <div className="rounded-3xl p-3 bg-linear-to-br from-[#16B8C8]/10 via-[#087F8A]/10 to-[#FF725E]/10 border border-[#E3E8E8] shadow-xl">
                <div className="rounded-2xl bg-white border border-[#E3E8E8] p-6 sm:p-8 space-y-6">
                  {/* Mock Post Card */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name="Sarah Jenkins" size="md" status="online" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#172126] text-sm">Sarah Jenkins</span>
                          <span className="text-xs text-[#58666D]">@sarahj</span>
                        </div>
                        <span className="text-xs text-[#58666D]">Software Architect &bull; 2h ago</span>
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">Design Philosophy</Badge>
                  </div>

                  <p className="text-[#172126] text-sm sm:text-base leading-relaxed">
                    Social software should empower genuine discourse rather than maximize outrage loops.
                    Excited to experience <span className="font-semibold text-[#087F8A]">Looply</span> — a platform built on clarity, clean typography, and creator autonomy.
                  </p>

                  <div className="pt-4 border-t border-[#E3E8E8] flex items-center justify-between text-xs text-[#58666D]">
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-1.5 hover:text-rose-600 cursor-default">
                        <Icon name="heart" className="w-4 h-4 text-[#58666D]" />
                        <span>24</span>
                      </span>
                      <span className="flex items-center gap-1.5 hover:text-[#087F8A] cursor-default">
                        <Icon name="comments" className="w-4 h-4 text-[#58666D]" />
                        <span>8</span>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#58666D]">Community Highlight</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section id="features" className="py-20 bg-white border-y border-[#E3E8E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F8A]">
                Core Capabilities
              </h2>
              <p className="text-3xl font-extrabold text-[#172126] tracking-tight sm:text-4xl">
                Engineered for quality connection
              </p>
              <p className="text-[#252E34] text-sm leading-relaxed">
                Everything you need to express ideas, converse thoughtfully, and manage your online presence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#087F8A] flex items-center justify-center mb-2">
                    <Icon name="feed" className="w-6 h-6" />
                  </div>
                  <CardTitle>Distraction-Free Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-[#252E34] leading-relaxed">
                    A chronological, focused stream centered on quality written content, curated topics, and discussions that matter without manipulative doom-scrolling.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-2xl bg-[#FF725E]/10 text-[#FF725E] flex items-center justify-center mb-2">
                    <Icon name="sparkles" className="w-6 h-6" />
                  </div>
                  <CardTitle>AI-Assisted Expression</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-[#252E34] leading-relaxed">
                    Integrated intelligent assistant to brainstorm perspectives, refine writing clarity, and summarize long-running community threads.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-2xl bg-[#087F8A]/10 text-[#087F8A] flex items-center justify-center mb-2">
                    <Icon name="shield" className="w-6 h-6" />
                  </div>
                  <CardTitle>Audited Integrity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-[#252E34] leading-relaxed">
                    Robust role-based moderation, login activity tracking, and clear administrative oversight to ensure community safety and transparent standards.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How Looply Works Section */}
        <section id="how-it-works" className="py-20 bg-[#F6F8F7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#076C76]">
                Simple Workflow
              </h2>
              <p className="text-3xl font-extrabold text-[#172126] tracking-tight sm:text-4xl">
                How Looply Works
              </p>
              <p className="text-[#252E34] text-sm leading-relaxed">
                Three effortless steps to begin connecting and sharing your perspective.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-[#E3E8E8] shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#16B8C8] text-[#172126] font-bold text-sm flex items-center justify-center">
                  1
                </div>
                <h3 className="text-base font-semibold text-[#172126]">Create Your Profile</h3>
                <p className="text-xs text-[#58666D] leading-relaxed">
                  Sign up with email verification, configure your avatar, customize your bio, and tailor your interest preferences.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E3E8E8] shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#16B8C8] text-[#172126] font-bold text-sm flex items-center justify-center">
                  2
                </div>
                <h3 className="text-base font-semibold text-[#172126]">Publish &amp; Discover</h3>
                <p className="text-xs text-[#58666D] leading-relaxed">
                  Compose rich thoughts, format insights, engage in conversation threads, and discover creators across specialized topics.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E3E8E8] shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#16B8C8] text-[#172126] font-bold text-sm flex items-center justify-center">
                  3
                </div>
                <h3 className="text-base font-semibold text-[#172126]">Amplify with AI</h3>
                <p className="text-xs text-[#58666D] leading-relaxed">
                  Leverage built-in AI tools to refine drafts, brainstorm new topics, and quickly digest active discussions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community Purpose & Principles Section */}
        <section id="community" className="py-20 bg-white border-b border-[#E3E8E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#087F8A]">
                Our Philosophy &amp; Principles
              </h2>
              <p className="text-3xl font-extrabold text-[#172126] tracking-tight sm:text-4xl">
                The Looply Community
              </p>
              <p className="text-[#58666D] text-sm leading-relaxed">
                Why we created Looply and how creators, readers, and thinkers interact with purpose.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#F6F8F7] border border-[#E3E8E8] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100/70 text-[#087F8A] flex items-center justify-center font-bold text-lg">
                  <Icon name="heart" className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#172126]">Why Looply Exists</h3>
                <p className="text-xs sm:text-sm text-[#252E34] leading-relaxed">
                  Traditional social platforms prioritize polarizing engagement over genuine insight. Looply is built from the ground up to return social technology to its original promise: authentic expression, human connection, and meaningful community dialogue without manipulation.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-[#F6F8F7] border border-[#E3E8E8] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100/70 text-[#087F8A] flex items-center justify-center font-bold text-lg">
                  <Icon name="edit" className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#172126]">How Users Share Ideas</h3>
                <p className="text-xs sm:text-sm text-[#252E34] leading-relaxed">
                  Share concise insights or in-depth technical analysis in a chronological feed. Readers see posts when they are published, ensuring that creators connect with an engaged audience on their own merit rather than algorithmic favouritism.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-[#F6F8F7] border border-[#E3E8E8] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100/70 text-[#087F8A] flex items-center justify-center font-bold text-lg">
                  <Icon name="comments" className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#172126]">How Users Interact</h3>
                <p className="text-xs sm:text-sm text-[#252E34] leading-relaxed">
                  Engage in chronological, threaded commentary, express appreciation with instant likes, and receive real-time notifications via secure Socket.IO websockets. Respectful discourse is reinforced by verified accounts and transparent community moderation.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-[#F6F8F7] border border-[#E3E8E8] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-100/70 text-[#087F8A] flex items-center justify-center font-bold text-lg">
                  <Icon name="sparkles" className="w-5 h-5 text-[#FF725E]" />
                </div>
                <h3 className="text-lg font-bold text-[#172126]">How AI Supports Discussions</h3>
                <p className="text-xs sm:text-sm text-[#252E34] leading-relaxed">
                  Integrated with Google Gemini 2.5, Looply provides instant discussion summaries of complex comment threads. Whether catching up on active debates or polishing your writing tone, AI is an assistive co-pilot, never a replacement for your human voice.
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <Button
                href={ROUTES.PUBLIC.REGISTER}
                variant="primary"
                size="lg"
                className="shadow-sm"
              >
                Join the Looply Community &rarr;
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Callout Section */}
        <section className="py-20 bg-linear-to-r from-[#172126] via-[#252E34] to-[#172126] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to experience modern social connection?
            </h2>
            <p className="text-cyan-200 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Explore the frontend interface, test the layouts, and discover how Looply is structured.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                href={ROUTES.PUBLIC.REGISTER}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto bg-white text-[#087F8A] hover:bg-[#F6F8F7]"
              >
                Sign Up Now
              </Button>
              <Button
                href={ROUTES.PUBLIC.LOGIN}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent border-cyan-300/40 text-white hover:bg-white/10"
              >
                Sign In to Account
              </Button>
              <Button
                href={ROUTES.USER.FEED}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto bg-transparent border-cyan-300/40 text-white hover:bg-[#16B8C8]/30"
              >
                Go to Social Feed
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
