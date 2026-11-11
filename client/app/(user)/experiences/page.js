'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Card, { CardContent } from '@/components/ui/Card';
import { ROUTES } from '@/lib/routes';

const CATEGORIES = [
  { id: 'all', label: 'All Experiences' },
  { id: 'signature', label: 'Signature' },
  { id: 'spaces', label: 'Spaces & Social' },
  { id: 'interactive', label: 'Interactive & Play' },
  { id: 'moments', label: 'Moments & Vaults' }
];

export default function ExperiencesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const experiences = [
    {
      id: 'split-reality',
      name: 'Split-Reality Posts',
      category: 'signature',
      categoryLabel: 'Signature Experience',
      badgeVariant: 'coral',
      icon: 'split',
      iconColor: 'text-[#FF6257]',
      iconBg: 'bg-[#FF6257]/15',
      borderColor: 'hover:border-[#FF6257]/50',
      description:
        'Reveal two connected perspectives of the same moment: the polished final result on one side and the raw, authentic behind-the-scenes reality on the other.',
      status: 'Available Now',
      statusType: 'available',
      primaryAction: {
        label: 'Create Split-Reality',
        href: ROUTES.USER.FEED,
        variant: 'primary'
      },
      secondaryAction: {
        label: 'View in Feed',
        href: ROUTES.USER.FEED,
        variant: 'outline'
      },
      featured: true,
      highlight: 'Interactive slider reveal'
    },
    {
      id: 'time-capsule',
      name: 'Time Capsules',
      category: 'moments',
      categoryLabel: 'Moments & Vaults',
      badgeVariant: 'lavender',
      icon: 'vault',
      iconColor: 'text-[#B9A8F5]',
      iconBg: 'bg-[#B9A8F5]/15',
      borderColor: 'hover:border-[#B9A8F5]/50',
      description:
        'Seal thoughts, photos, and messages into future time vaults. Set a release date with automated countdowns and share unlocking moments with friends.',
      status: 'Active Experience',
      statusType: 'available',
      primaryAction: {
        label: 'Open Vaults',
        href: ROUTES.USER.TIME_CAPSULE,
        variant: 'secondary'
      },
      featured: false,
      highlight: 'Automated countdown unlock'
    },
    {
      id: 'circles',
      name: 'Circles & Communities',
      category: 'spaces',
      categoryLabel: 'Spaces & Social',
      badgeVariant: 'lime',
      icon: 'circles',
      iconColor: 'text-[#D5F36A]',
      iconBg: 'bg-[#D5F36A]/15',
      borderColor: 'hover:border-[#D5F36A]/50',
      description:
        'Connect in topic-focused community hubs. Join dedicated circles around technology, arts, gaming, science, and design with focused discussion streams.',
      status: 'Active Communities',
      statusType: 'available',
      primaryAction: {
        label: 'Explore Circles',
        href: ROUTES.USER.CIRCLES,
        variant: 'secondary'
      },
      featured: false,
      highlight: 'Topic-curated networks'
    },
    {
      id: 'play',
      name: 'Looply Play & Challenges',
      category: 'interactive',
      categoryLabel: 'Interactive & Play',
      badgeVariant: 'coral',
      icon: 'play',
      iconColor: 'text-[#FF6257]',
      iconBg: 'bg-[#FF6257]/15',
      borderColor: 'hover:border-[#FF6257]/50',
      description:
        'Test bonds and spark lighthearted conversations with social games including "Who Knows Me Better?", "Two Truths & a Lie", and "Emoji Challenges".',
      status: 'Active Games',
      statusType: 'available',
      primaryAction: {
        label: 'Launch Games',
        href: ROUTES.USER.PLAY,
        variant: 'secondary'
      },
      featured: false,
      highlight: 'Social mini-games'
    },
    {
      id: 'events',
      name: 'Global Mystery Events',
      category: 'interactive',
      categoryLabel: 'Interactive & Play',
      badgeVariant: 'lavender',
      icon: 'events',
      iconColor: 'text-[#B9A8F5]',
      iconBg: 'bg-[#B9A8F5]/15',
      borderColor: 'hover:border-[#B9A8F5]/50',
      description:
        'Engage in platform-wide mystery solving. Crack community riddles, piece together clues with fellow creators, and climb the real-time event leaderboard.',
      status: 'Live Events',
      statusType: 'available',
      primaryAction: {
        label: 'Join Mystery',
        href: ROUTES.USER.EVENTS,
        variant: 'secondary'
      },
      featured: false,
      highlight: 'Platform-wide riddles'
    },
    {
      id: 'memories',
      name: 'Friendship Memories',
      category: 'moments',
      categoryLabel: 'Moments & Vaults',
      badgeVariant: 'lime',
      icon: 'heart',
      iconColor: 'text-[#D5F36A]',
      iconBg: 'bg-[#D5F36A]/15',
      borderColor: 'hover:border-[#D5F36A]/50',
      description:
        'Celebrate mutual milestones, interaction streaks, and shared conversations with mutual followers directly on creator and friend profiles.',
      status: 'Profile Integration',
      statusType: 'available',
      primaryAction: {
        label: 'View Mutuals',
        href: ROUTES.USER.FEED,
        variant: 'secondary'
      },
      featured: false,
      highlight: 'Milestones & streaks'
    },
    {
      id: 'mood-orbit',
      name: 'Mood-Orbit Rooms',
      category: 'spaces',
      categoryLabel: 'Spaces & Social',
      badgeVariant: 'outline',
      icon: 'sparkles',
      iconColor: 'text-[#777580]',
      iconBg: 'bg-[#24202E]',
      borderColor: 'border-[#2D2938]',
      description:
        'Ephemeral atmospheric listening and reflection rooms tailored to daily emotional states, collaborative music queues, and low-friction presence.',
      status: 'Coming Next',
      statusType: 'future',
      primaryAction: {
        label: 'Coming Next',
        disabled: true,
        variant: 'outline'
      },
      featured: false,
      highlight: 'In Development'
    },
    {
      id: 'feed-heists',
      name: 'Feed Heists',
      category: 'interactive',
      categoryLabel: 'Interactive & Play',
      badgeVariant: 'outline',
      icon: 'key',
      iconColor: 'text-[#777580]',
      iconBg: 'bg-[#24202E]',
      borderColor: 'border-[#2D2938]',
      description:
        'Collaborative storytelling quests where community choices unlock secret clues, hidden post branches, and limited-edition profile badges.',
      status: 'Coming Next',
      statusType: 'future',
      primaryAction: {
        label: 'Coming Next',
        disabled: true,
        variant: 'outline'
      },
      featured: false,
      highlight: 'In Development'
    }
  ];

  const filteredExperiences =
    selectedCategory === 'all'
      ? experiences
      : experiences.filter((exp) => exp.category === selectedCategory);

  const featuredExperience = experiences.find((exp) => exp.featured);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        title="Your Looply Experiences"
        description="Discover interactive social formats, creative signature posts, and community spaces beyond ordinary scrolling."
        badge={
          <Badge variant="coral" size="sm">
            Interactive Hub
          </Badge>
        }
      />

      {/* Featured Signature Experience Banner */}
      {featuredExperience && (selectedCategory === 'all' || selectedCategory === 'signature') && (
        <section aria-labelledby="featured-experience-heading" className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF6257] via-[#B9A8F5] to-[#D5F36A] rounded-3xl opacity-20 group-hover:opacity-35 blur-md transition duration-500 pointer-events-none" />
          
          <div className="relative rounded-2xl bg-[#1E1B26] border border-[#FF6257]/40 p-6 sm:p-7 shadow-2xl overflow-hidden">
            {/* Background Accent Mesh */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#FF6257]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="coral" size="sm">
                    Signature Experience
                  </Badge>
                  <span className="text-[11px] font-mono text-[#D5F36A]">
                    • Interactive Dual-Perspective
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6257]/15 border border-[#FF6257]/30 flex items-center justify-center text-[#FF6257] shrink-0">
                    <Icon name="split" className="w-5 h-5" />
                  </div>
                  <h2
                    id="featured-experience-heading"
                    className="text-lg sm:text-xl font-black text-[#F6F2EA] font-display"
                  >
                    {featuredExperience.name}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-[#777580] leading-relaxed">
                  {featuredExperience.description}
                </p>

                <p className="text-[11px] text-[#A8A5B2] flex items-center gap-1.5 pt-1">
                  <Icon name="info" className="w-3.5 h-3.5 text-[#FF6257] shrink-0" />
                  <span>Available directly inside the post creation drawer on your Home Feed.</span>
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-row md:flex-col sm:items-stretch gap-2.5 w-full md:w-auto shrink-0">
                <Button
                  href={featuredExperience.primaryAction.href}
                  variant={featuredExperience.primaryAction.variant}
                  size="md"
                  className="flex-1 md:flex-none justify-center"
                >
                  <Icon name="split" className="w-4 h-4" />
                  <span>{featuredExperience.primaryAction.label}</span>
                </Button>
                {featuredExperience.secondaryAction && (
                  <Button
                    href={featuredExperience.secondaryAction.href}
                    variant={featuredExperience.secondaryAction.variant}
                    size="md"
                    className="flex-1 md:flex-none justify-center"
                  >
                    <span>{featuredExperience.secondaryAction.label}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Experience Categories">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#FF6257] text-[#17151D] shadow-md shadow-[#FF6257]/20 font-bold'
                  : 'bg-[#1E1B26] text-[#777580] hover:text-[#F6F2EA] hover:bg-[#24202E] border border-[#2D2938]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Experience Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
        {filteredExperiences
          .filter((exp) => selectedCategory !== 'all' || !exp.featured)
          .map((exp) => {
            const isFuture = exp.statusType === 'future';

            return (
              <Card
                key={exp.id}
                className={`flex flex-col justify-between transition-all duration-200 border ${
                  isFuture
                    ? 'border-[#2D2938]/60 bg-[#17151D]/80 opacity-75'
                    : `border-[#2D2938] hover:border-[#FF6257]/40 bg-[#1E1B26] hover:bg-[#201D29] hover:-translate-y-0.5 shadow-sm hover:shadow-lg`
                }`}
              >
                <CardContent className="p-5 flex flex-col h-full justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Header: Icon & Category Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`w-10 h-10 rounded-xl ${exp.iconBg} border border-white/5 flex items-center justify-center ${exp.iconColor} shrink-0`}
                      >
                        <Icon name={exp.icon} className="w-5 h-5" />
                      </div>
                      <Badge variant={exp.badgeVariant} size="sm">
                        {exp.status}
                      </Badge>
                    </div>

                    {/* Title & Highlight */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#F6F2EA] font-display">
                        {exp.name}
                      </h3>
                      <p className="text-[10px] uppercase tracking-wider font-mono text-[#777580] mt-0.5">
                        {exp.highlight}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#777580] leading-relaxed">
                      {exp.description}
                    </p>
                  </div>

                  {/* Primary CTA */}
                  <div className="pt-2 border-t border-[#2D2938]/60">
                    {isFuture ? (
                      <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-[#24202E] text-[#777580] border border-[#2D2938] select-none">
                        <span className="font-medium text-[11px]">Feature In Development</span>
                        <span className="text-[10px] uppercase font-bold text-[#D5F36A]">Coming Next</span>
                      </div>
                    ) : (
                      <Button
                        href={exp.primaryAction.href}
                        variant={exp.primaryAction.variant || 'secondary'}
                        size="sm"
                        className="w-full justify-between group"
                      >
                        <span>{exp.primaryAction.label}</span>
                        <Icon
                          name="chevronRight"
                          className="w-4 h-4 text-[#777580] group-hover:text-current group-hover:translate-x-0.5 transition-all"
                        />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Footer Context / Philosophy Card */}
      <div className="p-5 rounded-2xl bg-[#17151D] border border-[#2D2938] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#F6F2EA] font-display">
            Purpose-Driven Social Experiences
          </p>
          <p className="text-[11px] text-[#777580] leading-relaxed">
            Looply separates interactive game formats, time vaults, and community spaces from your primary feed so your social timeline stays focused on genuine creator content.
          </p>
        </div>
        <Button
          href={ROUTES.USER.FEED}
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          <span>Return to Feed</span>
        </Button>
      </div>
    </div>
  );
}
