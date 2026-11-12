'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import PostComposer from '@/components/posts/PostComposer';
import PostCard from '@/components/posts/PostCard';
import { postService } from '@/services/postService';
import { ROUTES } from '@/lib/routes';

const FEED_MODES = [
  {
    id: 'latest',
    label: 'Community Conversations',
    desc: 'Real-time discussions, questions, and daily moments from across Looply'
  },
  {
    id: 'following',
    label: 'Following',
    desc: 'Chronological thoughts and updates from creators you follow'
  }
];

export default function FeedPage() {
  // 'latest' as default ensures active content is immediately visible for both new and existing users
  const [feedMode, setFeedMode] = useState('latest');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const fetchFeed = useCallback(async (mode, page = 1) => {
    return postService.getFeed({ page, limit: 10, mode });
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setErrorMessage('');

    fetchFeed(feedMode, 1)
      .then((res) => {
        if (!ignore && res?.success) {
          setPosts(res.posts || []);
          setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setErrorMessage(err.message || 'Unable to load feed. Please try again.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [feedMode, fetchFeed]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setPagination((prev) => ({ ...prev, total: (prev.total || 0) + 1 }));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setPagination((prev) => ({ ...prev, total: Math.max(0, (prev.total || 1) - 1) }));
  };

  const handleLoadMore = () => {
    if (pagination.page >= pagination.totalPages || loadingMore) return;
    setLoadingMore(true);
    const nextPage = pagination.page + 1;

    fetchFeed(feedMode, nextPage)
      .then((res) => {
        if (res?.success) {
          setPosts((prev) => [...prev, ...(res.posts || [])]);
          setPagination(res.pagination || { page: nextPage, totalPages: 1, total: 0 });
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Failed to load more posts.');
      })
      .finally(() => {
        setLoadingMore(false);
      });
  };

  const handleRetry = () => {
    setLoading(true);
    setErrorMessage('');
    fetchFeed(feedMode, 1)
      .then((res) => {
        if (res?.success) {
          setPosts(res.posts || []);
          setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Unable to load feed. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const activeModeMeta = useMemo(() => {
    return FEED_MODES.find((m) => m.id === feedMode) || FEED_MODES[0];
  }, [feedMode]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Feed Context Header */}
      <header className="p-5 sm:p-6 rounded-2xl bg-[#1E1B26] border border-[#2D2938] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30 font-display">
                Social Stream
              </span>
              <span className="text-[11px] text-[#777580] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D5F36A] animate-pulse" />
                Live Community
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#F6F2EA] font-display tracking-tight">
              Community Feed
            </h1>
            <p className="text-xs sm:text-sm text-[#777580] max-w-xl leading-relaxed">
              Your conversational home for daily updates, questions, and thoughtful reflections with friends.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Link
              href={ROUTES.USER.EXPLORE}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#17151D] bg-[#D5F36A] hover:bg-[#c6e655] transition-all font-display shadow-md shadow-[#D5F36A]/20"
            >
              <Icon name="split" className="w-3.5 h-3.5 text-[#17151D]" />
              <span>Explore Visuals</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Quick Composer Entry */}
      <section aria-label="Create Post">
        <PostComposer onPostCreated={handlePostCreated} />
      </section>

      {/* Visual Discoveries Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#1E1B26] to-[#17151D] border border-[#2D2938] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#777580]">
          <Icon name="sparkles" className="w-4 h-4 text-[#FF6257]" />
          <span>Looking for photography and dual-perspective stories?</span>
        </div>
        <Link
          href={ROUTES.USER.EXPLORE}
          className="text-[#D5F36A] font-bold hover:underline flex items-center gap-1 font-display"
        >
          <span>Visual Explore</span>
          <span>→</span>
        </Link>
      </div>

      {/* 3. Feed Mode / Filter Controls */}
      <section className="space-y-2" aria-label="Feed Modes">
        <div className="flex items-center justify-between gap-2 border-b border-[#2D2938] pb-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            {FEED_MODES.map((mode) => {
              const isActive = feedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFeedMode(mode.id)}
                  aria-pressed={isActive}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                    isActive
                      ? 'bg-[#FF6257] text-[#17151D] font-bold shadow-md shadow-[#FF6257]/20'
                      : 'bg-[#1E1B26] border border-[#2D2938] text-[#777580] hover:text-[#F6F2EA] hover:border-[#777580]/40'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-[#777580] hidden sm:inline whitespace-nowrap">
            {pagination.total > 0 ? `${pagination.total} posts` : 'Active Feed'}
          </span>
        </div>

        {/* Sub-label describing the active mode */}
        <p className="text-[11px] text-[#777580] px-1">
          {activeModeMeta.desc}
        </p>
      </section>

      {/* Error state with retry */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <Icon name="alertCircle" className="w-4 h-4 shrink-0 text-[#FF6257]" />
            <span>{errorMessage}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="shrink-0 text-xs"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 4. Main Posts Stream */}
      {loading ? (
        <div className="space-y-4" aria-label="Loading feed posts">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] shadow-sm space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#24202E]" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-[#24202E] rounded" />
                  <div className="w-20 h-2.5 bg-[#24202E]/60 rounded" />
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="w-full h-3 bg-[#24202E] rounded" />
                <div className="w-5/6 h-3 bg-[#24202E] rounded" />
                <div className="w-3/5 h-3 bg-[#24202E]/60 rounded" />
              </div>
              <div className="pt-2 border-t border-[#2D2938] flex gap-4">
                <div className="w-12 h-6 bg-[#24202E] rounded-lg" />
                <div className="w-12 h-6 bg-[#24202E] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="feed"
          title={
            feedMode === 'following'
              ? 'Your Following Feed is Quiet'
              : feedMode === 'explore'
              ? 'No Trending Posts Right Now'
              : 'Your Loop is Empty'
          }
          description={
            feedMode === 'following'
              ? "You aren't following anyone with recent posts yet. Switch to the Latest timeline to discover active creators!"
              : feedMode === 'explore'
              ? 'Trending discussions with high likes and comments will automatically appear here.'
              : 'No community posts have been published yet. Be the first to share your thoughts using the composer above!'
          }
          badgeText="Looply Feed"
          action={
            feedMode === 'following' ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setFeedMode('latest')}
              >
                Switch to Latest Feed
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          ))}

          {/* Pagination: Load More */}
          {pagination.page < pagination.totalPages && (
            <div className="pt-4 text-center">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full sm:w-auto min-w-[200px]"
              >
                {loadingMore ? 'Loading More Posts...' : 'Load More Posts'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
