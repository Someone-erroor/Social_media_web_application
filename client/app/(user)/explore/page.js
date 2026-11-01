'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/posts/PostCard';
import { postService } from '@/services/postService';

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const topics = [
    'Technology',
    'Design Systems',
    'Software Architecture',
    'Next.js',
    'Artificial Intelligence',
    'Creative Writing',
    'Web Engineering'
  ];

  useEffect(() => {
    let ignore = false;
    postService
      .getExplore({ page: 1, limit: 10 })
      .then((res) => {
        if (!ignore && res?.success) {
          setPosts(res.posts || []);
          setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setErrorMessage(err.message || 'Unable to load explore posts.');
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
    if (pagination.page >= pagination.totalPages) return;
    setLoadingMore(true);
    const nextPage = pagination.page + 1;

    postService
      .getExplore({ page: nextPage, limit: 10 })
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
      .getExplore({ page: 1, limit: 10 })
      .then((res) => {
        if (res?.success) {
          setPosts(res.posts || []);
          setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
        }
      })
      .catch((err) => {
        setErrorMessage(err.message || 'Unable to load explore posts.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore"
        description="Discover recent thoughts and conversations from creators across Looply"
      />

      {/* Category Tag Pills */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9BAAB4]">
          Suggested Topics
        </h2>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-[#151F29] border border-[#263640] text-[#F4F8FA] hover:bg-[#1D2A35] hover:text-[#19D3E3] hover:border-[#19D3E3]/50 transition-colors cursor-pointer"
            >
              #{topic}
            </span>
          ))}
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FF6F61]/10 border border-[#FF6F61]/30 text-xs text-[#FF6F61] flex items-center justify-between">
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

      {/* Posts Section */}
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-semibold text-[#F4F8FA]">
          Recent Discussions
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#151F29] border border-[#263640] shadow-md shadow-black/20 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1D2A35]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-28 h-3.5 bg-[#1D2A35] rounded" />
                    <div className="w-16 h-2.5 bg-[#1D2A35] rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="w-full h-3 bg-[#1D2A35] rounded" />
                  <div className="w-3/4 h-3 bg-[#1D2A35] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon="explore"
            title="No Posts Discovered Yet"
            description="As creators publish community posts, they will appear here in chronological order for discovery."
            badgeText="Explore Feed"
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
    </div>
  );
}
