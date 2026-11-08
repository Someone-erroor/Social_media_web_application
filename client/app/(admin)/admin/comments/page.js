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

export default function AdminCommentsPage() {
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchComments = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getComments({ page, limit: 10, search });
      setComments(res.comments || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch platform comments.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    let ignore = false;
    adminService
      .getComments({ page: 1, limit: 10, search })
      .then((res) => {
        if (!ignore) {
          setComments(res.comments || []);
          setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to fetch platform comments.');
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

  const handleDeleteComment = async (commentId) => {
    setDeletingId(commentId);
    setError('');
    setSuccessMessage('');
    try {
      await adminService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setConfirmDeleteId(null);
      setSuccessMessage('Comment deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete comment.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comment Moderation"
        description="Inspect discussion comments across all community publications and moderate abuse"
        badge={
          <Badge variant="lavender" size="sm">
            Live Comments
          </Badge>
        }
      />

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#D5F36A]/10 border border-[#D5F36A]/30 text-xs text-[#D5F36A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="check" className="w-4 h-4 text-[#D5F36A] shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage('')} className="text-[#D5F36A] hover:text-white">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-[#FF6257] hover:text-white">
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:max-w-md">
          <Input
            id="admin-search-comments"
            aria-label="Search comments by keyword"
            placeholder="Search comments by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Icon name="search" className="w-4 h-4" />}
          />
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => fetchComments(1)} disabled={loading}>
          Search
        </Button>
      </div>

      {/* Table Container */}
      <Card className="overflow-hidden bg-[#1E1B26] border-[#2D2938]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F6F2EA]">
            <thead className="bg-[#17151D] border-b border-[#2D2938] text-[#777580] uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-5 py-3.5">Author</th>
                <th scope="col" className="px-5 py-3.5">Comment Text</th>
                <th scope="col" className="px-5 py-3.5">Target Post</th>
                <th scope="col" className="px-5 py-3.5">Date</th>
                <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2938]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#777580] font-medium">
                    Loading comments for moderation...
                  </td>
                </tr>
              ) : comments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <EmptyState
                      icon="comments"
                      title="No Comments Found"
                      description="No discussion comments match the search criteria or the platform has no active replies."
                      className="border-none rounded-none bg-transparent py-12"
                    />
                  </td>
                </tr>
              ) : (
                comments.map((comment) => {
                  const author = comment.author || {};
                  const post = comment.post || {};
                  const isConfirming = confirmDeleteId === comment._id;

                  return (
                    <tr key={comment._id} className="hover:bg-[#17151D]/60 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={author.fullName || 'User'}
                            src={author.profile?.avatarUrl}
                            size="sm"
                          />
                          <div>
                            <span className="font-semibold text-[#F6F2EA] block">
                              {author.fullName || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-[#777580] font-mono">
                              {author.email || '—'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                        <p className="line-clamp-2 text-[#F6F2EA] break-words font-medium">
                          {comment.content}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs text-[#777580]">
                        <p className="line-clamp-1 italic text-[11px]">
                          {post.content ? `"${post.content}"` : 'Post referenced'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-[#777580]">
                        {formatDate(comment.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        {isConfirming ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              disabled={deletingId === comment._id}
                              onClick={() => handleDeleteComment(comment._id)}
                            >
                              {deletingId === comment._id ? 'Deleting...' : 'Confirm'}
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
                            onClick={() => setConfirmDeleteId(comment._id)}
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
          <div className="flex items-center justify-between p-4 border-t border-[#2D2938] bg-[#17151D] text-xs text-[#777580]">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total comments)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchComments(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchComments(pagination.page + 1)}
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
