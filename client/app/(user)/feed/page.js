'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
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
      <header className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7E5E0] shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EEEAFE] text-[#6C63FF] border border-[#6C63FF]/20 font-display">
                Social Playground
              </span>
              <span className="text-[11px] text-[#6B6B73] flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF78] animate-pulse" />
                Live Community
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#1E1E24] font-display tracking-tight">
              Community Feed
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B73] max-w-xl leading-relaxed">
              Your conversational home for daily updates, questions, and thoughtful reflections with friends.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Link
              href={ROUTES.USER.EXPLORE}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#6C63FF] bg-[#EEEAFE] hover:bg-[#6C63FF] hover:text-white transition-all font-display shadow-2xs cursor-pointer"
            >
              <Icon name="split" className="w-3.5 h-3.5" />
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
      <div className="p-3.5 rounded-xl bg-[#EEEAFE] border border-[#6C63FF]/20 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#1E1E24]">
          <Icon name="sparkles" className="w-4 h-4 text-[#6C63FF]" />
          <span>Looking for photography and dual-perspective stories?</span>
        </div>
        <Link
          href={ROUTES.USER.EXPLORE}
          className="text-[#6C63FF] font-bold hover:underline flex items-center gap-1 font-display"
        >
          <span>Visual Explore</span>
          <span>→</span>
        </Link>
      </div>

      {/* 3. Feed Mode / Filter Controls */}
      <section className="space-y-2" aria-label="Feed Modes">
        <div className="flex items-center justify-between gap-2 border-b border-[#E7E5E0] pb-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2">
            {FEED_MODES.map((mode) => {
              const isActive = feedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFeedMode(mode.id)}
                  aria-pressed={isActive}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                    isActive
                      ? 'bg-[#6C63FF] text-white shadow-xs'
                      : 'bg-white border border-[#E7E5E0] text-[#6B6B73] hover:text-[#1E1E24] hover:border-[#6C63FF]/30'
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>

          <span className="text-[11px] text-[#6B6B73] hidden sm:inline whitespace-nowrap">
            {pagination.total > 0 ? `${pagination.total} posts` : 'Active Feed'}
          </span>
        </div>

        {/* Sub-label describing the active mode */}
        <p className="text-[11px] text-[#6B6B73] px-1">
          {activeModeMeta.desc}
        </p>
      </section>

      {/* Error state with retry */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-[#FFEAEA] border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <Icon name="alertCircle" className="w-4 h-4 shrink-0 text-[#FF6B6B]" />
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
              className="p-5 rounded-2xl bg-white border border-[#E7E5E0] shadow-xs space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F1F0EC]" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-[#F1F0EC] rounded" />
                  <div className="w-20 h-2.5 bg-[#F1F0EC]/60 rounded" />
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="w-full h-3 bg-[#F1F0EC] rounded" />
                <div className="w-5/6 h-3 bg-[#F1F0EC] rounded" />
                <div className="w-3/5 h-3 bg-[#F1F0EC]/60 rounded" />
              </div>
              <div className="pt-2 border-t border-[#E7E5E0] flex gap-4">
                <div className="w-12 h-6 bg-[#F1F0EC] rounded-lg" />
                <div className="w-12 h-6 bg-[#F1F0EC] rounded-lg" />
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
              : 'Your Loop is Empty'
          }
          description={
            feedMode === 'following'
              ? "You aren't following anyone with recent posts yet. Switch to Community Conversations to discover active creators!"
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
                Switch to Community Conversations
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
