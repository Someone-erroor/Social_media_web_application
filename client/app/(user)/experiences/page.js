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
      badgeVariant: 'primary',
      icon: 'split',
      iconColor: 'text-[#6C63FF]',
      iconBg: 'bg-[#EEEAFE]',
      description:
        'Reveal two connected perspectives of the same moment: the polished final result on one side and the raw, authentic behind-the-scenes reality on the other.',
      status: 'Available Now',
      statusType: 'available',
      primaryAction: {
        label: 'Discover in Explore',
        href: ROUTES.USER.EXPLORE,
        variant: 'primary'
      },
      secondaryAction: {
        label: 'Create in Feed',
        href: ROUTES.USER.FEED,
        variant: 'outline'
      },
      featured: true,
      highlight: 'Interactive slider reveal'
    },
    {
      id: 'play',
      name: 'Looply Play & Games',
      category: 'interactive',
      categoryLabel: 'Interactive & Play',
      badgeVariant: 'yellow',
      icon: 'play',
      iconColor: 'text-[#B28200]',
      iconBg: 'bg-[#FFF7E0]',
      description:
        'Spark playful banter and test your connections with friendly social games: "Who Knows Me?", "Two Truths & a Lie", "Emoji Riddles", and "Picture Mysteries".',
      status: 'Active Arcade',
      statusType: 'available',
      primaryAction: {
        label: 'Play Arcade',
        href: ROUTES.USER.PLAY,
        variant: 'yellow'
      },
      featured: false,
      highlight: '4 social game modes'
    },
    {
      id: 'mood-orbit',
      name: 'Mood-Orbit Rooms',
      category: 'spaces',
      categoryLabel: 'Spaces & Social',
      badgeVariant: 'lime',
      icon: 'sparkles',
      iconColor: 'text-[#2E7D4E]',
      iconBg: 'bg-[#E8F7EE]',
      description:
        'Cozy, temporary atmospheric spaces tailored to creative, curious, or chill vibes with live presence and friendly conversation.',
      status: 'Live Atmospheric Rooms',
      statusType: 'available',
      primaryAction: {
        label: 'Pull Up a Chair',
        href: ROUTES.USER.MOOD_ORBIT,
        variant: 'primary'
      },
      featured: false,
      highlight: 'Real-time presence & prompts'
    },
    {
      id: 'time-capsule',
      name: 'Time Capsules',
      category: 'moments',
      categoryLabel: 'Moments & Vaults',
      badgeVariant: 'lavender',
      icon: 'vault',
      iconColor: 'text-[#6C63FF]',
      iconBg: 'bg-[#EEEAFE]',
      description:
        'Seal thoughts, photos, and messages into future time vaults. Set a release date with automated countdowns and share unlocking moments with friends.',
      status: 'Active Vaults',
      statusType: 'available',
      primaryAction: {
        label: 'Open Vaults',
        href: ROUTES.USER.TIME_CAPSULE,
        variant: 'outline'
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
      iconColor: 'text-[#2E7D4E]',
      iconBg: 'bg-[#E8F7EE]',
      description:
        'Connect in topic-focused community hubs. Join dedicated circles around technology, arts, gaming, science, and design with focused discussion streams.',
      status: 'Active Communities',
      statusType: 'available',
      primaryAction: {
        label: 'Explore Circles',
        href: ROUTES.USER.CIRCLES,
        variant: 'outline'
      },
      featured: false,
      highlight: 'Topic-curated networks'
    },
    {
      id: 'feed-heists',
      name: 'Community Quests & Heists',
      category: 'interactive',
      categoryLabel: 'Interactive & Play',
      badgeVariant: 'coral',
      icon: 'key',
      iconColor: 'text-[#FF6B6B]',
      iconBg: 'bg-[#FFEAEA]',
      description:
        'Collaborative, time-sensitive community mysteries where friends team up to unlock secret clues and crack hidden codes together.',
      status: 'Active Quests',
      statusType: 'available',
      primaryAction: {
        label: 'Join Quests',
        href: ROUTES.USER.HEISTS,
        variant: 'primary'
      },
      featured: false,
      highlight: 'Team mystery solving'
    },
    {
      id: 'events',
      name: 'Global Mystery Events',
      category: 'interactive',
      categoryLabel: 'Interactive & Play',
      badgeVariant: 'lavender',
      icon: 'events',
      iconColor: 'text-[#6C63FF]',
      iconBg: 'bg-[#EEEAFE]',
      description:
        'Engage in platform-wide mystery solving. Crack community riddles, piece together clues with fellow creators, and climb the real-time event leaderboard.',
      status: 'Live Events',
      statusType: 'available',
      primaryAction: {
        label: 'Join Mystery',
        href: ROUTES.USER.EVENTS,
        variant: 'outline'
      },
      featured: false,
      highlight: 'Platform-wide riddles'
    },
    {
      id: 'memories',
      name: 'Friendship Memories',
      category: 'moments',
      categoryLabel: 'Moments & Vaults',
      badgeVariant: 'coral',
      icon: 'heart',
      iconColor: 'text-[#FF6B6B]',
      iconBg: 'bg-[#FFEAEA]',
      description:
        'Celebrate mutual milestones, interaction streaks, and shared conversations with mutual followers directly on creator and friend profiles.',
      status: 'Profile Integration',
      statusType: 'available',
      primaryAction: {
        label: 'View Profile',
        href: ROUTES.USER.PROFILE,
        variant: 'outline'
      },
      featured: false,
      highlight: 'Milestones & streaks'
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
          <Badge variant="primary" size="sm">
            Experiences Hub
          </Badge>
        }
      />

      {/* Featured Signature Experience Banner */}
      {featuredExperience && (selectedCategory === 'all' || selectedCategory === 'signature') && (
        <section aria-labelledby="featured-experience-heading" className="relative group">
          <div className="relative rounded-2xl bg-gradient-to-r from-[#EEEAFE] via-white to-[#FFF7E0] border border-[#6C63FF]/30 p-6 sm:p-7 shadow-xs overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary" size="sm">
                    Signature Experience
                  </Badge>
                  <span className="text-[11px] font-mono text-[#6C63FF]">
                    • Interactive Dual-Perspective
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#6C63FF]/30 flex items-center justify-center text-[#6C63FF] shrink-0 shadow-2xs">
                    <Icon name="split" className="w-5 h-5" />
                  </div>
                  <h2
                    id="featured-experience-heading"
                    className="text-lg sm:text-xl font-black text-[#1E1E24] font-display"
                  >
                    {featuredExperience.name}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-[#6B6B73] leading-relaxed">
                  {featuredExperience.description}
                </p>

                <p className="text-[11px] text-[#6B6B73] flex items-center gap-1.5 pt-1">
                  <Icon name="info" className="w-3.5 h-3.5 text-[#6C63FF] shrink-0" />
                  <span>Available directly inside the post creation drawer on your Community Feed.</span>
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-row md:flex-col sm:items-stretch gap-2.5 w-full md:w-auto shrink-0">
                <Button
                  href={featuredExperience.primaryAction.href}
                  variant="primary"
                  size="md"
                  className="flex-1 md:flex-none justify-center"
                >
                  <Icon name="split" className="w-4 h-4" />
                  <span>{featuredExperience.primaryAction.label}</span>
                </Button>
                {featuredExperience.secondaryAction && (
                  <Button
                    href={featuredExperience.secondaryAction.href}
                    variant="outline"
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
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Experience Categories">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#6C63FF] text-white shadow-xs font-bold'
                  : 'bg-white text-[#6B6B73] hover:text-[#1E1E24] border border-[#E7E5E0]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Experience Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredExperiences
          .filter((exp) => selectedCategory !== 'all' || !exp.featured)
          .map((exp) => {
            return (
              <Card
                key={exp.id}
                className="flex flex-col justify-between transition-all duration-200 border border-[#E7E5E0] bg-white hover:border-[#6C63FF]/40 shadow-xs hover:shadow-sm"
              >
                <CardContent className="p-5 flex flex-col h-full justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Header: Icon & Category Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`w-10 h-10 rounded-xl ${exp.iconBg} border border-[#E7E5E0] flex items-center justify-center ${exp.iconColor} shrink-0`}
                      >
                        <Icon name={exp.icon} className="w-5 h-5" />
                      </div>
                      <Badge variant={exp.badgeVariant} size="sm">
                        {exp.status}
                      </Badge>
                    </div>

                    {/* Title & Highlight */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#1E1E24] font-display">
                        {exp.name}
                      </h3>
                      <p className="text-[10px] uppercase tracking-wider font-mono text-[#6B6B73] mt-0.5">
                        {exp.highlight}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#6B6B73] leading-relaxed">
                      {exp.description}
                    </p>
                  </div>

                  {/* Primary CTA */}
                  <div className="pt-2 border-t border-[#E7E5E0]">
                    <Button
                      href={exp.primaryAction.href}
                      variant={exp.primaryAction.variant || 'outline'}
                      size="sm"
                      className="w-full justify-between group"
                    >
                      <span>{exp.primaryAction.label}</span>
                      <Icon
                        name="chevronRight"
                        className="w-4 h-4 text-[#6B6B73] group-hover:text-current group-hover:translate-x-0.5 transition-all"
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Footer Context / Philosophy Card */}
      <div className="p-5 rounded-2xl bg-[#F8F7F4] border border-[#E7E5E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#1E1E24] font-display">
            Purpose-Driven Social Experiences
          </p>
          <p className="text-[11px] text-[#6B6B73] leading-relaxed">
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
