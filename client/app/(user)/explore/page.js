'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import Card, { CardContent } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/posts/PostCard';
import { postService } from '@/services/postService';
import { circleService } from '@/services/circleService';
import { ROUTES } from '@/lib/routes';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'circles' | 'experiences'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Posts state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Circles state
  const [circles, setCircles] = useState([]);
  const [loadingCircles, setLoadingCircles] = useState(false);
  const [circlesError, setCirclesError] = useState('');

  // 1. Fetch explore posts from real backend endpoint
  const loadExplorePosts = useCallback(async (page = 1) => {
    return postService.getExplore({ page, limit: 10 });
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoadingPosts(true);
    setPostsError('');

    loadExplorePosts(1)
      .then((res) => {
        if (!ignore && res?.success) {
          setPosts(res.posts || []);
          setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setPostsError(err.message || 'Unable to load explore posts.');
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
  }, [loadExplorePosts]);

  // 2. Fetch community circles from real backend endpoint
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

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleLoadMore = () => {
    if (pagination.page >= pagination.totalPages || loadingMore) return;
    setLoadingMore(true);
    const nextPage = pagination.page + 1;

    loadExplorePosts(nextPage)
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

  const handleRetry = () => {
    setLoadingPosts(true);
    setPostsError('');
    loadExplorePosts(1)
      .then((res) => {
        if (res?.success) {
          setPosts(res.posts || []);
          setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
        }
      })
      .catch((err) => {
        setPostsError(err.message || 'Unable to load explore posts.');
      })
      .finally(() => {
        setLoadingPosts(false);
      });
  };

  // Real search filtering across posts
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

  // Real search filtering across circles
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
      title: 'Split-Reality Storytelling',
      badge: 'Signature',
      badgeColor: 'coral',
      icon: 'split',
      desc: 'Publish two synchronized perspectives of one moment: The Final result and Behind the Reality.',
      href: ROUTES.USER.FEED,
      action: 'Try in Feed'
    },
    {
      id: 'play',
      title: 'Looply Play Games',
      badge: 'Interactive',
      badgeColor: 'coral',
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
      desc: 'Lock personal letters, milestone predictions, and memories into time-locked encryption vaults.',
      href: ROUTES.USER.TIME_CAPSULE,
      action: 'Open Vaults'
    },
    {
      id: 'circles',
      title: 'Community Circles',
      badge: 'Social',
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
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Explore Hero & Context */}
      <header className="p-5 sm:p-6 rounded-2xl bg-[#1E1B26] border border-[#2D2938] shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30 font-display">
                Discovery Hub
              </span>
              <span className="text-[11px] text-[#777580]">Platform Explorer</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F6F2EA] font-display tracking-tight">
              Explore Looply
            </h1>
            <p className="text-xs sm:text-sm text-[#777580] max-w-xl leading-relaxed">
              Discover community discussions, find topic-driven circles, and experience signature Looply features.
            </p>
          </div>

          <Link
            href={ROUTES.USER.EXPERIENCES}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#17151D] bg-[#D5F36A] hover:bg-[#c6e655] transition-all shadow-md shadow-[#D5F36A]/20 shrink-0 self-start sm:self-center font-display"
          >
            <Icon name="experiences" className="w-3.5 h-3.5 text-[#17151D]" />
            <span>Experiences Hub</span>
          </Link>
        </div>

        {/* Real Search Bar */}
        <div className="relative pt-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions by keywords, creators, or topics..."
            aria-label="Search posts and communities"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#17151D] border border-[#2D2938] text-xs sm:text-sm text-[#F6F2EA] placeholder-[#777580] focus:outline-none focus:border-[#FF6257] transition-colors"
          />
          <Icon
            name="search"
            className="w-4 h-4 text-[#777580] absolute left-3.5 top-[calc(50%+2px)] -translate-y-1/2 pointer-events-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-[calc(50%+2px)] -translate-y-1/2 text-[#777580] hover:text-[#F6F2EA] p-1 cursor-pointer"
              aria-label="Clear search"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2D2938] pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'posts', label: 'Discussions & Posts', count: filteredPosts.length },
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                isActive
                  ? 'bg-[#FF6257] text-[#17151D] font-bold shadow-md shadow-[#FF6257]/20'
                  : 'bg-[#1E1B26] border border-[#2D2938] text-[#777580] hover:text-[#F6F2EA]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-[#17151D]/20 text-[#17151D]' : 'bg-[#2D2938] text-[#777580]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {postsError && activeTab === 'posts' && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between"
        >
          <span>{postsError}</span>
          <Button type="button" variant="outline" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      )}

      {/* 3. Tab Content */}
      {/* TAB A: Public Posts Stream */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#24202E]" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-32 h-3.5 bg-[#24202E] rounded" />
                      <div className="w-20 h-2.5 bg-[#24202E]/60 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-3 bg-[#24202E] rounded" />
                  <div className="w-4/5 h-3 bg-[#24202E]/60 rounded" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              icon="explore"
              title={searchQuery ? 'No Matches Found' : 'No Public Posts Yet'}
              description={
                searchQuery
                  ? `No public discussions matched "${searchQuery}". Try searching with different keywords.`
                  : 'Public community posts will populate here as creators publish in their Loop.'
              }
              badgeText="Explore Feed"
              action={
                searchQuery ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                ) : (
                  <Link href={ROUTES.USER.FEED}>
                    <Button type="button" variant="primary" size="sm">
                      Go to Feed
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                />
              ))}

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
                    {loadingMore ? 'Loading More Posts...' : 'Load More Discussions'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB B: Community Circles Discovery */}
      {activeTab === 'circles' && (
        <div className="space-y-4">
          {circlesError && (
            <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
              {circlesError}
            </div>
          )}

          {loadingCircles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse space-y-3">
                  <div className="w-20 h-4 bg-[#24202E] rounded" />
                  <div className="w-3/4 h-5 bg-[#24202E] rounded" />
                  <div className="w-full h-8 bg-[#24202E] rounded" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCircles.map((circle) => (
                <Card
                  key={circle._id}
                  className="bg-[#1E1B26] border-[#2D2938] hover:border-[#D5F36A]/50 transition-all flex flex-col justify-between shadow-xl"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D5F36A]/15 text-[#D5F36A] border border-[#D5F36A]/30 font-display">
                        {circle.category}
                      </span>
                      <span className="text-[11px] text-[#777580] flex items-center gap-1">
                        <Icon name="users" className="w-3.5 h-3.5 text-[#D5F36A]" />
                        {circle.memberCount || circle.members?.length || 1} members
                      </span>
                    </div>

                    <div className="space-y-1">
                      <Link
                        href={ROUTES.USER.CIRCLE_DETAIL(circle.slug)}
                        className="text-sm font-bold text-[#F6F2EA] hover:text-[#D5F36A] font-display transition-colors line-clamp-1 block"
                      >
                        {circle.name}
                      </Link>
                      <p className="text-xs text-[#777580] line-clamp-2 leading-relaxed">
                        {circle.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#2D2938] flex items-center justify-between">
                      <span className="text-[11px] text-[#777580] truncate max-w-[130px]">
                        By {circle.creator?.fullName || 'Creator'}
                      </span>
                      <Link href={ROUTES.USER.CIRCLE_DETAIL(circle.slug)}>
                        <Button type="button" size="xs" variant="outline">
                          View Circle
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB C: Signature Experiences Spotlight */}
      {activeTab === 'experiences' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {experienceSpotlights.map((exp) => (
            <Card
              key={exp.id}
              className="bg-[#1E1B26] border-[#2D2938] hover:border-[#FF6257]/50 transition-all flex flex-col justify-between shadow-xl group"
            >
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#17151D] border border-[#2D2938] flex items-center justify-center text-[#FF6257]">
                    <Icon name={exp.icon} className="w-5 h-5 text-[#FF6257]" />
                  </div>
                  <Badge variant={exp.badgeColor} size="sm">
                    {exp.badge}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-[#F6F2EA] group-hover:text-[#FF6257] font-display transition-colors">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-[#777580] leading-relaxed">
                    {exp.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#2D2938]">
                  <Link href={exp.href}>
                    <Button type="button" size="sm" variant="outline" className="w-full text-xs">
                      {exp.action} →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
