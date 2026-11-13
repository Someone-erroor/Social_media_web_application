'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import SplitRealityViewer from '@/components/posts/SplitRealityViewer';
import { postService } from '@/services/postService';
import { circleService } from '@/services/circleService';
import { ROUTES } from '@/lib/routes';

const VISUAL_CATEGORIES = [
  { id: 'all', label: 'All Visuals' },
  { id: 'split-reality', label: 'Split-Reality' },
  { id: 'photography', label: 'Photography' },
  { id: 'art', label: 'Art & Design' }
];

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('visuals'); // 'visuals' | 'circles' | 'experiences'
  const [visualCategory, setVisualCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Visual posts state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Selected post for Visual Showcase / Lightbox modal
  const [selectedVisualPost, setSelectedVisualPost] = useState(null);
  const [likedPostsMap, setLikedPostsMap] = useState({});

  // Circles state
  const [circles, setCircles] = useState([]);
  const [loadingCircles, setLoadingCircles] = useState(false);
  const [circlesError, setCirclesError] = useState('');

  // 1. Fetch visual explore posts
  const loadExplorePosts = useCallback(async (page = 1, category = 'all') => {
    return postService.getExplore({ page, limit: 12, category });
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoadingPosts(true);
    setPostsError('');

    loadExplorePosts(1, visualCategory)
      .then((res) => {
        if (!ignore && res?.success) {
          setPosts(res.posts || []);
          setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setPostsError(err.message || 'Unable to load visual discoveries.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingPosts(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [visualCategory, loadExplorePosts]);

  // 2. Fetch community circles
  useEffect(() => {
    let ignore = false;
    setLoadingCircles(true);
    circleService
      .listCircles({ limit: 12 })
      .then((res) => {
        if (!ignore && res?.success) {
          setCircles(res.circles || []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setCirclesError(err.message || 'Failed to load community circles.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingCircles(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleLoadMore = () => {
    if (pagination.page >= pagination.totalPages || loadingMore) return;
    setLoadingMore(true);
    const nextPage = pagination.page + 1;

    loadExplorePosts(nextPage, visualCategory)
      .then((res) => {
        if (res?.success) {
          setPosts((prev) => [...prev, ...(res.posts || [])]);
          setPagination(res.pagination || { page: nextPage, totalPages: 1, total: 0 });
        }
      })
      .catch((err) => {
        setPostsError(err.message || 'Failed to load more posts.');
      })
      .finally(() => {
        setLoadingMore(false);
      });
  };

  const handleLikePost = async (postId) => {
    try {
      const res = await postService.likePost(postId);
      if (res?.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId ? { ...p, likesCount: res.likesCount } : p
          )
        );
        setLikedPostsMap((prev) => ({ ...prev, [postId]: res.hasLiked }));
        if (selectedVisualPost && selectedVisualPost._id === postId) {
          setSelectedVisualPost((prev) => ({
            ...prev,
            likesCount: res.likesCount
          }));
        }
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Search filtering across posts
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase().trim();
    return posts.filter((p) => {
      const contentMatch = p.content?.toLowerCase().includes(query);
      const authorMatch = p.author?.fullName?.toLowerCase().includes(query);
      const circleMatch = p.circle?.name?.toLowerCase().includes(query);
      return contentMatch || authorMatch || circleMatch;
    });
  }, [posts, searchQuery]);

  // Search filtering across circles
  const filteredCircles = useMemo(() => {
    if (!searchQuery.trim()) return circles;
    const query = searchQuery.toLowerCase().trim();
    return circles.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(query);
      const descMatch = c.description?.toLowerCase().includes(query);
      const catMatch = c.category?.toLowerCase().includes(query);
      return nameMatch || descMatch || catMatch;
    });
  }, [circles, searchQuery]);

  // Curated signature experiences roadmap
  const experienceSpotlights = [
    {
      id: 'split-reality',
      title: 'Split-Reality Stories',
      badge: 'Signature',
      badgeColor: 'primary',
      icon: 'split',
      desc: 'Publish two synchronized perspectives of one moment: The Final result and Behind the Reality.',
      href: ROUTES.USER.FEED,
      action: 'Create in Feed'
    },
    {
      id: 'play',
      title: 'Looply Play Games',
      badge: 'Interactive',
      badgeColor: 'yellow',
      icon: 'play',
      desc: 'Spark friendly banter with "Who Knows Me?", "Two Truths & Lie", and emoji riddles.',
      href: ROUTES.USER.PLAY,
      action: 'Launch Games'
    },
    {
      id: 'time-capsule',
      title: 'Time Capsules',
      badge: 'Vaults',
      badgeColor: 'lavender',
      icon: 'vault',
      desc: 'Lock personal letters, milestone predictions, and memories into time-locked vaults.',
      href: ROUTES.USER.TIME_CAPSULE,
      action: 'Open Vaults'
    },
    {
      id: 'circles',
      title: 'Community Circles',
      badge: 'Spaces',
      badgeColor: 'lime',
      icon: 'circles',
      desc: 'Join focused micro-communities dedicated strictly to design, tech, gaming, and photography.',
      href: ROUTES.USER.CIRCLES,
      action: 'View Circles'
    },
    {
      id: 'events',
      title: 'Global Mystery Events',
      badge: 'Detective',
      badgeColor: 'coral',
      icon: 'events',
      desc: 'Solve platform-wide collaborative riddles, decode evidence clues, and join the Hall of Fame.',
      href: ROUTES.USER.EVENTS,
      action: 'Investigate'
    },
    {
      id: 'feed-heists',
      title: 'Community Quests',
      badge: 'Quests',
      badgeColor: 'coral',
      icon: 'key',
      desc: 'Collaborative, time-sensitive community quests where friends unlock secret clues and crack mysteries.',
      href: ROUTES.USER.HEISTS,
      action: 'Join Quests'
    },
    {
      id: 'mood-orbit',
      title: 'Mood-Orbit Rooms',
      badge: 'Atmospheric',
      badgeColor: 'lime',
      icon: 'sparkles',
      desc: 'Enter cozy temporary spaces tuned to creative, curious, or chill intentions with real-time presence.',
      href: ROUTES.USER.MOOD_ORBIT,
      action: 'Pull Up a Chair'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Explore Hero & Context */}
      <header className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E5E0] shadow-xs relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20 font-display">
                Visual Discovery
              </span>
              <span className="text-[11px] text-[#6B6B73]">Photography &amp; Split-Reality</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E1E24] font-display tracking-tight">
              Explore Visual Discoveries
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B73] max-w-xl leading-relaxed">
              Immerse yourself in photography, creative digital art, and interactive Split-Reality moments from creators worldwide.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.USER.FEED}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1E1E24] bg-[#F1F0EC] border border-[#E7E5E0] hover:bg-[#E7E5E0] transition-all font-display"
            >
              <Icon name="feed" className="w-3.5 h-3.5 text-[#6C63FF]" />
              <span>Text Feed</span>
            </Link>
            <Link
              href={ROUTES.USER.EXPERIENCES}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#574FE8] transition-all shadow-xs shrink-0 font-display"
            >
              <Icon name="experiences" className="w-3.5 h-3.5" />
              <span>Experiences</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative pt-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search visual discoveries by tags, creators, or keywords..."
            aria-label="Search visual media and communities"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#F8F7F4] border border-[#E7E5E0] text-xs sm:text-sm text-[#1E1E24] placeholder:text-[#6B6B73]/60 focus:outline-hidden focus:bg-white focus:border-[#6C63FF] transition-all"
          />
          <Icon
            name="search"
            className="w-4 h-4 text-[#6B6B73] absolute left-3.5 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-[calc(50%+2px)] -translate-y-1/2 text-[#6B6B73] hover:text-[#1E1E24] p-1 cursor-pointer"
              aria-label="Clear search"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Top-level Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E7E5E0] pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'visuals', label: 'Visuals & Perspectives', count: filteredPosts.length },
          { id: 'circles', label: 'Topic Communities', count: filteredCircles.length },
          { id: 'experiences', label: 'Signature Experiences', count: experienceSpotlights.length }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                isActive
                  ? 'bg-[#6C63FF] text-white shadow-xs'
                  : 'bg-white border border-[#E7E5E0] text-[#6B6B73] hover:text-[#1E1E24]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-[#F1F0EC] text-[#6B6B73]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {postsError && activeTab === 'visuals' && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center justify-between"
        >
          <span>{postsError}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => loadExplorePosts(1, visualCategory)}>
            Retry
          </Button>
        </div>
      )}

      {/* 3. Tab Content */}
      {/* =========================================================================
          TAB A: VISUAL DISCOVERIES & SPLIT-REALITY GRID
         ========================================================================= */}
      {activeTab === 'visuals' && (
        <div className="space-y-5">
          {/* Visual Category Sub-Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {VISUAL_CATEGORIES.map((cat) => {
              const isSelected = visualCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setVisualCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/30 font-bold'
                      : 'text-[#6B6B73] hover:text-[#1E1E24] bg-white border border-[#E7E5E0]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {loadingPosts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border border-[#E7E5E0] animate-pulse overflow-hidden space-y-3"
                >
                  <div className="w-full h-48 bg-[#F1F0EC]" />
                  <div className="p-3 space-y-2">
                    <div className="w-3/4 h-3 bg-[#F1F0EC] rounded" />
                    <div className="w-1/2 h-2.5 bg-[#F1F0EC]/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              icon="split"
              title={searchQuery ? 'No Visuals Matched' : 'No Visuals Published Yet'}
              description={
                searchQuery
                  ? `No visual discoveries matched "${searchQuery}". Try other keywords.`
                  : 'Be the first to share a photograph or Split-Reality perspective with the community!'
              }
              badgeText="Visual Explore"
              action={
                <Link href={ROUTES.USER.FEED}>
                  <Button type="button" variant="primary" size="sm">
                    Create in Feed
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredPosts.map((post) => {
                const isSplitReality = post.postType === 'splitReality';

                return (
                  <div
                    key={post._id}
                    onClick={() => setSelectedVisualPost(post)}
                    className="group relative rounded-2xl overflow-hidden bg-white border border-[#E7E5E0] hover:border-[#6C63FF]/50 transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    {/* Media Display */}
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-[#F1F0EC]">
                      <img
                        src={post.primaryMedia || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26'}
                        alt={post.content || 'Visual perspective'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Perspective Badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {isSplitReality ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#6C63FF] text-white shadow-xs font-display flex items-center gap-1">
                            <Icon name="split" className="w-3 h-3 text-white" />
                            Split-Reality
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/90 backdrop-blur-md text-[#1E1E24] border border-[#E7E5E0] shadow-xs">
                            Visual
                          </span>
                        )}
                      </div>

                      {/* Hover stats overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                        <p className="text-xs text-white line-clamp-2 font-medium">
                          {post.content || 'Tap to view perspective'}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: Author & Engagement */}
                    <div className="p-3 bg-white border-t border-[#E7E5E0] flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <Avatar
                          name={post.author?.fullName || 'Creator'}
                          src={post.author?.profile?.avatarUrl}
                          size="xs"
                        />
                        <span className="text-[11px] font-semibold text-[#1E1E24] truncate">
                          {post.author?.fullName || 'Creator'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#6B6B73] shrink-0">
                        <span className="flex items-center gap-1">
                          <Icon name="heart" className="w-3 h-3 text-[#FF6B6B]" />
                          {post.likesCount || 0}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Icon name="chat" className="w-3 h-3 text-[#6C63FF]" />
                          {post.commentsCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pagination.page < pagination.totalPages && !searchQuery && (
            <div className="pt-4 text-center">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full sm:w-auto"
              >
                {loadingMore ? 'Loading More Visuals...' : 'Load More Discoveries'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB B: COMMUNITY CIRCLES DISCOVERY
         ========================================================================= */}
      {activeTab === 'circles' && (
        <div className="space-y-4">
          {circlesError && (
            <div className="p-3.5 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B]">
              {circlesError}
            </div>
          )}

          {loadingCircles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-white border border-[#E7E5E0] animate-pulse space-y-3">
                  <div className="w-20 h-4 bg-[#F1F0EC] rounded" />
                  <div className="w-3/4 h-5 bg-[#F1F0EC] rounded" />
                  <div className="w-full h-8 bg-[#F1F0EC] rounded" />
                </div>
              ))}
            </div>
          ) : filteredCircles.length === 0 ? (
            <EmptyState
              icon="circles"
              title={searchQuery ? 'No Circles Matched' : 'No Communities Found'}
              description={
                searchQuery
                  ? `No communities found matching "${searchQuery}".`
                  : 'Start a community circle to bring like-minded creators together!'
              }
              badgeText="Looply Communities"
              action={
                <Link href={ROUTES.USER.CIRCLES}>
                  <Button type="button" variant="primary" size="sm">
                    Explore Circles Page
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCircles.map((circle) => (
                <Card
                  key={circle._id}
                  className="bg-white border-[#E7E5E0] hover:border-[#6C63FF]/40 transition-all flex flex-col justify-between shadow-xs"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E8F7EE] text-[#2E7D4E] border border-[#4CAF78]/30 font-display">
                        {circle.category}
                      </span>
                      <span className="text-[11px] text-[#6B6B73]">
                        {circle.memberCount || circle.members?.length || 0} members
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#1E1E24] font-display line-clamp-1">
                        {circle.name}
                      </h3>
                      <p className="text-xs text-[#6B6B73] line-clamp-2 leading-relaxed">
                        {circle.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E7E5E0] flex items-center justify-between">
                      <Link
                        href={ROUTES.USER.CIRCLE_DETAIL(circle.slug)}
                        className="text-xs text-[#6C63FF] font-semibold hover:underline"
                      >
                        Enter Community →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB C: SIGNATURE EXPERIENCES
         ========================================================================= */}
      {activeTab === 'experiences' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {experienceSpotlights.map((exp) => (
            <Card
              key={exp.id}
              className="bg-white border-[#E7E5E0] hover:border-[#6C63FF]/40 transition-all flex flex-col justify-between shadow-xs"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-[#EEEAFE] text-[#6C63FF] flex items-center justify-center">
                    <Icon name={exp.icon} className="w-4 h-4" />
                  </div>
                  <Badge variant={exp.badgeColor} size="sm">
                    {exp.badge}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#1E1E24] font-display">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-[#6B6B73] leading-relaxed">
                    {exp.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E7E5E0]">
                  <Link href={exp.href}>
                    <Button type="button" variant="outline" size="sm" className="w-full text-xs">
                      {exp.action}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* =========================================================================
          VISUAL SHOWCASE / LIGHTBOX MODAL
         ========================================================================= */}
      {selectedVisualPost && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in"
        >
          <div className="w-full max-w-2xl bg-white border border-[#E7E5E0] rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E5E0]">
              <div className="flex items-center gap-2.5">
                <Avatar
                  name={selectedVisualPost.author?.fullName || 'Creator'}
                  src={selectedVisualPost.author?.profile?.avatarUrl}
                  size="sm"
                />
                <div>
                  <h3 className="text-xs font-bold text-[#1E1E24]">
                    {selectedVisualPost.author?.fullName || 'Creator'}
                  </h3>
                  <span className="text-[10px] text-[#6B6B73]">
                    {selectedVisualPost.postType === 'splitReality' ? 'Split-Reality Dual Perspective' : 'Visual Publication'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVisualPost(null)}
                aria-label="Close lightbox"
                className="text-[#6B6B73] hover:text-[#1E1E24] p-1.5 rounded-lg hover:bg-[#F1F0EC] cursor-pointer"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            {/* Media Presentation */}
            {selectedVisualPost.postType === 'splitReality' ? (
              <div className="space-y-2">
                <div className="text-[11px] text-[#6B6B73] flex items-center justify-between">
                  <span>✨ Slide left/right to reveal behind the scenes</span>
                </div>
                <SplitRealityViewer
                  primaryMedia={selectedVisualPost.primaryMedia}
                  realityMedia={selectedVisualPost.realityMedia}
                  className="rounded-xl overflow-hidden shadow-xs"
                />
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-[#E7E5E0] bg-[#F1F0EC]">
                <img
                  src={selectedVisualPost.primaryMedia}
                  alt={selectedVisualPost.content || 'Visual'}
                  className="w-full max-h-[460px] object-contain mx-auto"
                />
              </div>
            )}

            {/* Caption & Story */}
            {selectedVisualPost.content && (
              <p className="text-xs text-[#1E1E24] leading-relaxed bg-[#F8F7F4] p-3 rounded-xl border border-[#E7E5E0]">
                {selectedVisualPost.content}
              </p>
            )}

            {/* Engagement Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-[#E7E5E0]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleLikePost(selectedVisualPost._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E5E0] bg-[#F8F7F4] hover:border-[#6C63FF] text-xs font-semibold text-[#1E1E24] cursor-pointer transition-colors"
                >
                  <Icon name="heart" className="w-4 h-4 text-[#FF6B6B]" />
                  <span>{selectedVisualPost.likesCount || 0} Likes</span>
                </button>
                <span className="text-xs text-[#6B6B73]">
                  {selectedVisualPost.commentsCount || 0} Comments
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedVisualPost(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
