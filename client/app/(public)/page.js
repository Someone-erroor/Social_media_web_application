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
    <div className="min-h-screen flex flex-col bg-[#110F17] text-[#F6F2EA] antialiased selection:bg-[#FF6257] selection:text-white">
      {/* Responsive Public Navigation */}
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
          {/* Subtle Editorial Atmosphere Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#FF6257]/15 via-[#B9A8F5]/10 to-transparent blur-3xl rounded-full pointer-events-none animate-glow-pulse" />
          <div className="absolute -top-12 -left-20 w-80 h-80 bg-[#FF6257]/10 blur-3xl rounded-full pointer-events-none animate-float-slow" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-[#D5F36A]/10 blur-3xl rounded-full pointer-events-none animate-float" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E1B26] border border-[#FF6257]/30 shadow-lg shadow-[#FF6257]/5 animate-fade-in">
                <span className="flex h-2 w-2 rounded-full bg-[#FF6257] animate-pulse"></span>
                <span className="text-xs font-semibold text-[#FF6257] tracking-wide uppercase">
                  A New Era of Authentic Social Interaction
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-[1.1] animate-fade-in">
                Connect authentically.{' '}
                <span className="bg-gradient-to-r from-[#FF6257] via-[#B9A8F5] to-[#D5F36A] bg-clip-text text-transparent animate-gradient-shift">
                  Share your voice.
                </span>{' '}
                Express who you are.
              </h1>

              <p className="text-base sm:text-lg text-[#777580] max-w-2xl mx-auto leading-relaxed">
                Looply is the modern social platform where authentic dialogue thrives.
                Connect with communities, share rich posts, and amplify your thoughts
                with intelligent AI assistance.
              </p>

              {/* Hero Call-to-Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
                <Button
                  href={ROUTES.PUBLIC.REGISTER}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-lg shadow-[#FF6257]/25"
                >
                  Create Account
                </Button>
                <Button
                  href={ROUTES.PUBLIC.LOGIN}
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Sign In
                </Button>
                <Button
                  href={ROUTES.USER.FEED}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Explore Feed &rarr;
                </Button>
              </div>

              <div className="pt-3 text-xs text-[#777580] flex items-center justify-center gap-4">
                <span>&bull; No predatory algorithms</span>
                <span>&bull; Full privacy controls</span>
                <span>&bull; Google Gemini AI tools</span>
              </div>
            </div>

            {/* Product UI Mockup Card Preview */}
            <div className="mt-14 max-w-4xl mx-auto transition-transform duration-500 hover:scale-[1.01] animate-slide-up">
              <div className="rounded-3xl p-3 bg-gradient-to-br from-[#FF6257]/25 via-[#1E1B26] to-[#B9A8F5]/25 border border-[#2D2938] shadow-2xl shadow-black/80 hover:border-[#FF6257]/50 transition-colors">
                <div className="rounded-2xl bg-[#1E1B26] border border-[#2D2938] p-6 sm:p-8 space-y-6">
                  {/* Mock Post Card */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name="Sarah Jenkins" size="md" status="online" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F6F2EA] text-sm">Sarah Jenkins</span>
                          <span className="text-xs text-[#777580]">@sarahj</span>
                        </div>
                        <span className="text-xs text-[#777580]">Software Architect &bull; 2h ago</span>
                      </div>
                    </div>
                    <Badge variant="coral" size="sm">Design Philosophy</Badge>
                  </div>

                  <p className="text-[#F6F2EA] text-sm sm:text-base leading-relaxed">
                    Social software should empower genuine discourse rather than maximize outrage loops.
                    Excited to experience <span className="font-semibold text-[#FF6257]">Looply</span> — a platform built on clarity, clean typography, and creator autonomy.
                  </p>

                  <div className="pt-4 border-t border-[#2D2938] flex items-center justify-between text-xs text-[#777580]">
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-1.5 text-[#FF6257] cursor-default">
                        <Icon name="heart" className="w-4 h-4 text-[#FF6257]" />
                        <span>24</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[#B9A8F5] cursor-default">
                        <Icon name="comments" className="w-4 h-4 text-[#B9A8F5]" />
                        <span>8</span>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#D5F36A]">Community Highlight</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section id="features" className="py-20 bg-[#17151D] border-y border-[#2D2938]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF6257]">
                Core Capabilities
              </h2>
              <p className="text-3xl font-extrabold font-display text-[#F6F2EA] tracking-tight sm:text-4xl">
                Engineered for quality connection
              </p>
              <p className="text-[#777580] text-sm leading-relaxed">
                Everything you need to express ideas, converse thoughtfully, and manage your online presence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-[#1E1B26] border border-[#2D2938] interactive-card shadow-md group">
                <div className="w-12 h-12 rounded-2xl bg-[#17151D] text-[#FF6257] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-[#2D2938]">
                  <Icon name="feed" className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#F6F2EA] mb-2 group-hover:text-[#FF6257] transition-colors">
                  Distraction-Free Feed
                </h3>
                <p className="text-xs text-[#777580] leading-relaxed">
                  A chronological, focused stream centered on quality written content, curated topics, and discussions that matter without manipulative doom-scrolling.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-[#1E1B26] border border-[#2D2938] interactive-card shadow-md group">
                <div className="w-12 h-12 rounded-2xl bg-[#17151D] text-[#B9A8F5] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-[#2D2938]">
                  <Icon name="sparkles" className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#F6F2EA] mb-2 group-hover:text-[#B9A8F5] transition-colors">
                  AI-Assisted Expression
                </h3>
                <p className="text-xs text-[#777580] leading-relaxed">
                  Integrated Google Gemini AI assistant to brainstorm perspectives, refine writing clarity, and summarize long-running community threads.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-[#1E1B26] border border-[#2D2938] interactive-card shadow-md group">
                <div className="w-12 h-12 rounded-2xl bg-[#17151D] text-[#D5F36A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-[#2D2938]">
                  <Icon name="shield" className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#F6F2EA] mb-2 group-hover:text-[#D5F36A] transition-colors">
                  Audited Integrity
                </h3>
                <p className="text-xs text-[#777580] leading-relaxed">
                  Robust role-based moderation, login activity tracking, and clear administrative oversight to ensure community safety and transparent standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How Looply Works Section */}
        <section id="how-it-works" className="py-20 bg-[#110F17]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF6257]">
                Simple Workflow
              </h2>
              <p className="text-3xl font-extrabold font-display text-[#F6F2EA] tracking-tight sm:text-4xl">
                How Looply Works
              </p>
              <p className="text-[#777580] text-sm leading-relaxed">
                Three effortless steps to begin connecting and sharing your perspective.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#1E1B26] p-6 rounded-2xl border border-[#2D2938] hover:border-[#FF6257]/40 transition-colors shadow-md space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#FF6257] text-[#110F17] font-black text-sm flex items-center justify-center">
                  1
                </div>
                <h3 className="text-base font-semibold text-[#F6F2EA]">Create Your Profile</h3>
                <p className="text-xs text-[#777580] leading-relaxed">
                  Sign up with email verification, configure your avatar, customize your bio, and tailor your interest preferences.
                </p>
              </div>

              <div className="bg-[#1E1B26] p-6 rounded-2xl border border-[#2D2938] hover:border-[#B9A8F5]/40 transition-colors shadow-md space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#B9A8F5] text-[#110F17] font-black text-sm flex items-center justify-center">
                  2
                </div>
                <h3 className="text-base font-semibold text-[#F6F2EA]">Publish &amp; Discover</h3>
                <p className="text-xs text-[#777580] leading-relaxed">
                  Compose rich thoughts, format insights, engage in conversation threads, and discover creators across specialized topics.
                </p>
              </div>

              <div className="bg-[#1E1B26] p-6 rounded-2xl border border-[#2D2938] hover:border-[#D5F36A]/40 transition-colors shadow-md space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#D5F36A] text-[#110F17] font-black text-sm flex items-center justify-center">
                  3
                </div>
                <h3 className="text-base font-semibold text-[#F6F2EA]">Amplify with AI</h3>
                <p className="text-xs text-[#777580] leading-relaxed">
                  Leverage built-in Gemini AI tools to refine drafts, brainstorm new topics, and quickly digest active discussions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community Purpose & Principles Section */}
        <section id="community" className="py-20 bg-[#17151D] border-t border-[#2D2938]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF6257]">
                Our Philosophy &amp; Principles
              </h2>
              <p className="text-3xl font-extrabold font-display text-[#F6F2EA] tracking-tight sm:text-4xl">
                The Looply Community
              </p>
              <p className="text-[#777580] text-sm leading-relaxed">
                Why we created Looply and how creators, readers, and thinkers interact with purpose.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1B26] border border-[#2D2938] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#17151D] text-[#FF6257] border border-[#2D2938] flex items-center justify-center font-bold text-lg">
                  <Icon name="heart" className="w-5 h-5 text-[#FF6257]" />
                </div>
                <h3 className="text-lg font-bold text-[#F6F2EA]">Why Looply Exists</h3>
                <p className="text-xs sm:text-sm text-[#777580] leading-relaxed">
                  Traditional social platforms prioritize polarizing engagement over genuine insight. Looply is built from the ground up to return social technology to its original promise: authentic expression, human connection, and meaningful community dialogue without manipulation.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1B26] border border-[#2D2938] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#17151D] text-[#B9A8F5] border border-[#2D2938] flex items-center justify-center font-bold text-lg">
                  <Icon name="edit" className="w-5 h-5 text-[#B9A8F5]" />
                </div>
                <h3 className="text-lg font-bold text-[#F6F2EA]">How Users Share Ideas</h3>
                <p className="text-xs sm:text-sm text-[#777580] leading-relaxed">
                  Share concise insights or in-depth technical analysis in a chronological feed. Readers see posts when they are published, ensuring that creators connect with an engaged audience on their own merit rather than algorithmic favouritism.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1B26] border border-[#2D2938] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#17151D] text-[#D5F36A] border border-[#2D2938] flex items-center justify-center font-bold text-lg">
                  <Icon name="comments" className="w-5 h-5 text-[#D5F36A]" />
                </div>
                <h3 className="text-lg font-bold text-[#F6F2EA]">How Users Interact</h3>
                <p className="text-xs sm:text-sm text-[#777580] leading-relaxed">
                  Engage in chronological, threaded commentary, express appreciation with instant likes, and receive real-time notifications via secure Socket.IO websockets. Respectful discourse is reinforced by verified accounts and transparent community moderation.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1B26] border border-[#2D2938] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#17151D] text-[#FF6257] border border-[#2D2938] flex items-center justify-center font-bold text-lg">
                  <Icon name="sparkles" className="w-5 h-5 text-[#FF6257]" />
                </div>
                <h3 className="text-lg font-bold text-[#F6F2EA]">How AI Supports Discussions</h3>
                <p className="text-xs sm:text-sm text-[#777580] leading-relaxed">
                  Integrated with Google Gemini 3.8 Flash, Looply provides instant discussion summaries of complex comment threads. Whether catching up on active debates or polishing your writing tone, AI is an assistive co-pilot, never a replacement for your human voice.
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <Button
                href={ROUTES.PUBLIC.REGISTER}
                variant="primary"
                size="lg"
                className="shadow-md shadow-[#FF6257]/20"
              >
                Join the Looply Community &rarr;
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Callout Section */}
        <section className="py-20 bg-gradient-to-r from-[#17151D] via-[#1E1B26] to-[#17151D] border-t border-[#2D2938] text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[#F6F2EA]">
              Ready to experience modern social connection?
            </h2>
            <p className="text-[#777580] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Explore the frontend interface, test the layouts, and discover how Looply is structured.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Button
                href={ROUTES.PUBLIC.REGISTER}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-md shadow-[#FF6257]/20"
              >
                Sign Up Now
              </Button>
              <Button
                href={ROUTES.PUBLIC.LOGIN}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Sign In to Account
              </Button>
              <Button
                href={ROUTES.USER.FEED}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
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
