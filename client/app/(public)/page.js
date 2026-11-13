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
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#1E1E24] antialiased selection:bg-[#6C63FF] selection:text-white">
      {/* Responsive Public Navigation */}
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
          {/* Subtle Warm Playground Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#6C63FF]/10 via-[#FF6B6B]/10 to-[#FFD166]/10 blur-3xl rounded-full pointer-events-none animate-glow-pulse" />
          <div className="absolute -top-12 -left-20 w-80 h-80 bg-[#6C63FF]/8 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-10 -right-20 w-96 h-96 bg-[#FFD166]/15 blur-3xl rounded-full pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEEAFE] border border-[#6C63FF]/20 shadow-xs animate-fade-in">
                <span className="flex h-2 w-2 rounded-full bg-[#6C63FF] animate-pulse"></span>
                <span className="text-xs font-semibold text-[#6C63FF] tracking-wide uppercase">
                  A New Era of Authentic Social Interaction
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display text-[#1E1E24] tracking-tight leading-[1.1] animate-fade-in">
                Connect authentically.{' '}
                <span className="bg-gradient-to-r from-[#6C63FF] via-[#FF6B6B] to-[#FF9F1C] bg-clip-text text-transparent">
                  Share your voice.
                </span>{' '}
                Express who you are.
              </h1>

              <p className="text-base sm:text-lg text-[#6B6B73] max-w-2xl mx-auto leading-relaxed">
                Looply is the modern social platform where authentic dialogue and creative experiences thrive.
                Explore vibrant circles, play games with friends, and amplify your thoughts with intelligent AI assistance.
              </p>

              {/* Hero Call-to-Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
                <Button
                  href={ROUTES.PUBLIC.REGISTER}
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-md shadow-[#6C63FF]/25 font-bold"
                >
                  Create Account
                </Button>
                <Button
                  href={ROUTES.PUBLIC.LOGIN}
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto font-semibold"
                >
                  Sign In
                </Button>
                <Button
                  href={ROUTES.USER.FEED}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto font-semibold"
                >
                  Explore Feed &rarr;
                </Button>
              </div>

              <div className="pt-3 text-xs text-[#6B6B73] flex items-center justify-center gap-4">
                <span>&bull; No predatory algorithms</span>
                <span>&bull; Full privacy controls</span>
                <span>&bull; Google Gemini AI tools</span>
              </div>
            </div>

            {/* Product UI Mockup Card Preview */}
            <div className="mt-14 max-w-4xl mx-auto transition-transform duration-500 hover:scale-[1.01] animate-slide-up">
              <div className="rounded-3xl p-3 bg-gradient-to-br from-[#6C63FF]/15 via-[#FFFFFF] to-[#FF6B6B]/15 border border-[#E7E5E0] shadow-xl">
                <div className="rounded-2xl bg-[#FFFFFF] border border-[#E7E5E0] p-6 sm:p-8 space-y-6">
                  {/* Mock Post Card */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name="Sarah Jenkins" size="md" status="online" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E1E24] text-sm">Sarah Jenkins</span>
                          <span className="text-xs text-[#6B6B73]">@sarahj</span>
                        </div>
                        <span className="text-xs text-[#6B6B73]">Software Architect &bull; 2h ago</span>
                      </div>
                    </div>
                    <Badge variant="coral" size="sm">Design Philosophy</Badge>
                  </div>

                  <p className="text-[#1E1E24] text-sm sm:text-base leading-relaxed">
                    Social software should empower genuine discourse rather than maximize outrage loops.
                    Excited to experience <span className="font-semibold text-[#6C63FF]">Looply</span> — a platform built on clarity, clean typography, creative experiences, and creator autonomy.
                  </p>

                  <div className="pt-4 border-t border-[#E7E5E0] flex items-center justify-between text-xs text-[#6B6B73]">
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-1.5 text-[#FF6B6B] cursor-default font-semibold">
                        <Icon name="heart" className="w-4 h-4 text-[#FF6B6B]" />
                        <span>24</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[#6C63FF] cursor-default font-semibold">
                        <Icon name="comments" className="w-4 h-4 text-[#6C63FF]" />
                        <span>8</span>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D4E] font-medium">Community Highlight</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section id="features" className="py-20 bg-[#FFFFFF] border-y border-[#E7E5E0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
                Core Capabilities
              </h2>
              <p className="text-3xl font-extrabold font-display text-[#1E1E24] tracking-tight sm:text-4xl">
                Engineered for quality connection
              </p>
              <p className="text-[#6B6B73] text-sm leading-relaxed">
                Everything you need to express ideas, converse thoughtfully, and manage your online presence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E0] interactive-card shadow-xs group hover:border-[#6C63FF]/30 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] text-[#6C63FF] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-[#6C63FF]/20 shadow-xs">
                  <Icon name="feed" className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#1E1E24] mb-2 group-hover:text-[#6C63FF] transition-colors">
                  Distraction-Free Feed
                </h3>
                <p className="text-xs text-[#6B6B73] leading-relaxed">
                  A chronological, focused stream centered on quality written content, curated topics, and discussions that matter without manipulative doom-scrolling.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E0] interactive-card shadow-xs group hover:border-[#FF6B6B]/30 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#FFEAEA] text-[#FF6B6B] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-[#FF6B6B]/20 shadow-xs">
                  <Icon name="sparkles" className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#1E1E24] mb-2 group-hover:text-[#FF6B6B] transition-colors">
                  AI-Assisted Expression
                </h3>
                <p className="text-xs text-[#6B6B73] leading-relaxed">
                  Integrated Google Gemini AI assistant to brainstorm perspectives, refine writing clarity, and summarize long-running community threads.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E0] interactive-card shadow-xs group hover:border-[#4CAF78]/30 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] text-[#2E7D4E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-[#4CAF78]/20 shadow-xs">
                  <Icon name="shield" className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[#1E1E24] mb-2 group-hover:text-[#2E7D4E] transition-colors">
                  Audited Integrity
                </h3>
                <p className="text-xs text-[#6B6B73] leading-relaxed">
                  Robust role-based moderation, login activity tracking, and clear administrative oversight to ensure community safety and transparent standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How Looply Works Section */}
        <section id="how-it-works" className="py-20 bg-[#F8F7F4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
                Simple Workflow
              </h2>
              <p className="text-3xl font-extrabold font-display text-[#1E1E24] tracking-tight sm:text-4xl">
                How Looply Works
              </p>
              <p className="text-[#6B6B73] text-sm leading-relaxed">
                Three effortless steps to begin connecting and sharing your perspective.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E7E5E0] hover:border-[#6C63FF]/40 transition-colors shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#6C63FF] text-white font-black text-sm flex items-center justify-center shadow-xs">
                  1
                </div>
                <h3 className="text-base font-semibold text-[#1E1E24]">Create Your Profile</h3>
                <p className="text-xs text-[#6B6B73] leading-relaxed">
                  Sign up with email verification, configure your avatar, customize your bio, and tailor your interest preferences.
                </p>
              </div>

              <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E7E5E0] hover:border-[#FF6B6B]/40 transition-colors shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#FF6B6B] text-white font-black text-sm flex items-center justify-center shadow-xs">
                  2
                </div>
                <h3 className="text-base font-semibold text-[#1E1E24]">Publish &amp; Discover</h3>
                <p className="text-xs text-[#6B6B73] leading-relaxed">
                  Compose rich thoughts, format insights, engage in conversation threads, and discover creators across specialized topics.
                </p>
              </div>

              <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E7E5E0] hover:border-[#FFD166]/60 transition-colors shadow-xs space-y-3">
                <div className="w-8 h-8 rounded-full bg-[#FFD166] text-[#7A5800] font-black text-sm flex items-center justify-center shadow-xs">
                  3
                </div>
                <h3 className="text-base font-semibold text-[#1E1E24]">Amplify with AI</h3>
                <p className="text-xs text-[#6B6B73] leading-relaxed">
                  Leverage built-in Gemini AI tools to refine drafts, brainstorm new topics, and quickly digest active discussions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community Purpose & Principles Section */}
        <section id="community" className="py-20 bg-[#FFFFFF] border-t border-[#E7E5E0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
                Our Philosophy &amp; Principles
              </h2>
              <p className="text-3xl font-extrabold font-display text-[#1E1E24] tracking-tight sm:text-4xl">
                The Looply Community
              </p>
              <p className="text-[#6B6B73] text-sm leading-relaxed">
                Why we created Looply and how creators, readers, and thinkers interact with purpose.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-6 sm:p-8 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFEAEA] text-[#FF6B6B] border border-[#FF6B6B]/20 flex items-center justify-center font-bold text-lg shadow-xs">
                  <Icon name="heart" className="w-5 h-5 text-[#FF6B6B]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E1E24]">Why Looply Exists</h3>
                <p className="text-xs sm:text-sm text-[#6B6B73] leading-relaxed">
                  Traditional social platforms prioritize polarizing engagement over genuine insight. Looply is built from the ground up to return social technology to its original promise: authentic expression, human connection, and meaningful community dialogue without manipulation.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20 flex items-center justify-center font-bold text-lg shadow-xs">
                  <Icon name="edit" className="w-5 h-5 text-[#6C63FF]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E1E24]">How Users Share Ideas</h3>
                <p className="text-xs sm:text-sm text-[#6B6B73] leading-relaxed">
                  Share concise insights or in-depth technical analysis in a chronological feed. Readers see posts when they are published, ensuring that creators connect with an engaged audience on their own merit rather than algorithmic favouritism.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#2E7D4E] border border-[#4CAF78]/20 flex items-center justify-center font-bold text-lg shadow-xs">
                  <Icon name="comments" className="w-5 h-5 text-[#2E7D4E]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E1E24]">How Users Interact</h3>
                <p className="text-xs sm:text-sm text-[#6B6B73] leading-relaxed">
                  Engage in chronological, threaded commentary, express appreciation with instant likes, and receive real-time notifications via secure Socket.IO websockets. Respectful discourse is reinforced by verified accounts and transparent community moderation.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E0] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFF7E0] text-[#7A5800] border border-[#FFD166]/30 flex items-center justify-center font-bold text-lg shadow-xs">
                  <Icon name="sparkles" className="w-5 h-5 text-[#7A5800]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E1E24]">How AI Supports Discussions</h3>
                <p className="text-xs sm:text-sm text-[#6B6B73] leading-relaxed">
                  Integrated with Google Gemini 3.8 Flash, Looply provides instant discussion summaries of complex comment threads. Whether catching up on active debates or polishing your writing tone, AI is an assistive co-pilot, never a replacement for your human voice.
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <Button
                href={ROUTES.PUBLIC.REGISTER}
                variant="primary"
                size="lg"
                className="shadow-md shadow-[#6C63FF]/20 font-bold"
              >
                Join the Looply Community &rarr;
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Callout Section */}
        <section className="py-20 bg-gradient-to-r from-[#EEEAFE] via-[#F8F7F4] to-[#FFF7E0] border-t border-[#E7E5E0] text-[#1E1E24]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[#1E1E24]">
              Ready to experience modern social connection?
            </h2>
            <p className="text-[#6B6B73] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Explore the frontend interface, test the layouts, and discover how Looply is structured.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Button
                href={ROUTES.PUBLIC.REGISTER}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-md shadow-[#6C63FF]/20 font-bold"
              >
                Sign Up Now
              </Button>
              <Button
                href={ROUTES.PUBLIC.LOGIN}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto font-semibold"
              >
                Sign In to Account
              </Button>
              <Button
                href={ROUTES.USER.FEED}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto font-semibold"
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
