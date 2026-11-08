'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import PostComposer from '@/components/posts/PostComposer';
import PostCard from '@/components/posts/PostCard';
import { postService } from '@/services/postService';

export default function FeedPage() {
  const [feedMode, setFeedMode] = useState('following'); // 'following' | 'latest' | 'explore'
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setErrorMessage('');

    postService
      .getFeed({ page: 1, limit: 10, mode: feedMode })
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
  }, [feedMode]);

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
    if (pagination.page >= pagination.totalPages) return;
    setLoadingMore(true);
    const nextPage = pagination.page + 1;

    postService
      .getFeed({ page: nextPage, limit: 10, mode: feedMode })
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
    postService
      .getFeed({ page: 1, limit: 10, mode: feedMode })
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Home Feed"
        description="The latest thoughts and discussions from creators across Looply"
      />

      {/* Real Post Composer */}
      <PostComposer onPostCreated={handlePostCreated} />

      {/* User-Controlled Feed Modes */}
      <div className="flex items-center gap-2 border-b border-[#2D2938] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setFeedMode('following')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            feedMode === 'following'
              ? 'bg-[#FF6257] text-[#17151D] font-bold shadow-md shadow-[#FF6257]/20'
              : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
          }`}
        >
          Following
        </button>
        <button
          type="button"
          onClick={() => setFeedMode('latest')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            feedMode === 'latest'
              ? 'bg-[#FF6257] text-[#17151D] font-bold shadow-md shadow-[#FF6257]/20'
              : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
          }`}
        >
          Latest
        </button>
        <button
          type="button"
          onClick={() => setFeedMode('explore')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            feedMode === 'explore'
              ? 'bg-[#FF6257] text-[#17151D] font-bold shadow-md shadow-[#FF6257]/20'
              : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
          }`}
        >
          Explore Discovery
        </button>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Posts Stream */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] shadow-sm space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#24202E]" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-28 h-3.5 bg-[#24202E] rounded" />
                  <div className="w-16 h-2.5 bg-[#24202E]/60 rounded" />
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="w-full h-3 bg-[#24202E] rounded" />
                <div className="w-4/5 h-3 bg-[#24202E]/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon="feed"
          title="Your Feed is Empty"
          description="No posts have been published yet. Be the first to share your thoughts using the composer above!"
          badgeText="Community Feed"
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

          {/* Pagination: Load More Button */}
          {pagination.page < pagination.totalPages && (
            <div className="pt-2 text-center">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full sm:w-auto"
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
