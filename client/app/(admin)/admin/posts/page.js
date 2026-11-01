'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import { adminService } from '@/services/adminService';

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getPosts({ page, limit: 10, search });
      setPosts(res.posts || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch platform posts.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    let ignore = false;
    adminService
      .getPosts({ page: 1, limit: 10, search })
      .then((res) => {
        if (!ignore) {
          setPosts(res.posts || []);
          setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to fetch platform posts.');
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
  }, [search]);

  const handleDeletePost = async (postId) => {
    setDeletingId(postId);
    setError('');
    setSuccessMessage('');
    try {
      await adminService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setConfirmDeleteId(null);
      setSuccessMessage('Post deleted successfully with cascading comment and like removal.');
    } catch (err) {
      setError(err.message || 'Failed to delete post.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Post Moderation"
        description="Inspect all platform publications, monitor engagement, and moderate inappropriate content"
        badge={
          <Badge variant="primary" size="sm">
            Live Feed Moderation
          </Badge>
        }
      />

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="check" className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            id="admin-search-posts"
            aria-label="Search posts by content keywords"
            placeholder="Search posts by content keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Icon name="search" className="w-4 h-4" />}
          />
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => fetchPosts(1)} disabled={loading}>
          Search
        </Button>
      </div>

      {/* Table Container */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">Author</th>
                <th scope="col" className="px-5 py-3.5">Content Preview</th>
                <th scope="col" className="px-5 py-3.5 text-center">Likes</th>
                <th scope="col" className="px-5 py-3.5 text-center">Comments</th>
                <th scope="col" className="px-5 py-3.5">Published</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-700 font-medium">
                    Loading posts for moderation...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon="posts"
                      title="No Posts Found"
                      description="No posts match the search criteria or the platform has no active publications."
                      className="border-none rounded-none bg-white py-12"
                    />
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const author = post.author || {};
                  const isConfirming = confirmDeleteId === post._id;

                  return (
                    <tr key={post._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={author.fullName || 'User'}
                            src={author.profile?.avatarUrl}
                            size="sm"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {author.fullName || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">
                              {author.email || '—'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                        <p className="line-clamp-2 text-slate-800 break-words">
                          {post.content}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center font-mono">
                        {post.likesCount ?? 0}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-center font-mono">
                        {post.commentsCount ?? 0}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {isConfirming ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              disabled={deletingId === post._id}
                              onClick={() => handleDeletePost(post._id)}
                            >
                              {deletingId === post._id ? 'Deleting...' : 'Confirm'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setConfirmDeleteId(post._id)}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total posts)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchPosts(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchPosts(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
