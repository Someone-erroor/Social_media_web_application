'use client';

import { useState } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/services/postService';
import { ROUTES } from '@/lib/routes';

function formatTimestamp(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PostCard({ post, onPostUpdated, onPostDeleted }) {
  const { user } = useAuth();

  const authorId = typeof post.author === 'object' ? post.author?._id : post.author;
  const authorName = typeof post.author === 'object' ? post.author?.fullName : 'Creator';
  const authorAvatar = typeof post.author === 'object' ? post.author?.profile?.avatarUrl : '';

  const isOwner = user && (user._id === authorId || user.id === authorId);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleUpdate = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      setErrorMessage('Post content cannot be empty.');
      return;
    }
    if (trimmed.length > 1000) {
      setErrorMessage('Post content cannot exceed 1000 characters.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await postService.updatePost(post._id, { content: trimmed });
      setIsEditing(false);
      if (onPostUpdated && res.post) {
        onPostUpdated(res.post);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update post.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      await postService.deletePost(post._id);
      if (onPostDeleted) {
        onPostDeleted(post._id);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete post.');
      setShowConfirmDelete(false);
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Post Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={authorId ? ROUTES.USER.USER_PROFILE(authorId) : ROUTES.USER.FEED}>
              <Avatar
                name={authorName}
                src={authorAvatar}
                size="md"
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={authorId ? ROUTES.USER.USER_PROFILE(authorId) : ROUTES.USER.FEED}
                className="text-sm font-semibold text-slate-900 hover:text-indigo-600 truncate block transition-colors"
              >
                {authorName}
              </Link>
              <span className="text-xs text-slate-400">
                {formatTimestamp(post.createdAt)}
                {post.updatedAt && post.updatedAt !== post.createdAt && ' (edited)'}
              </span>
            </div>
          </div>

          {/* Owner Controls */}
          {isOwner && !isEditing && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditContent(post.content);
                  setIsEditing(true);
                  setShowConfirmDelete(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                title="Edit post"
              >
                <Icon name="edit" className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete post"
              >
                <Icon name="trash" className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Box */}
        {showConfirmDelete && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
            <p className="font-semibold">Delete this post?</p>
            <p className="text-red-600">This action cannot be undone.</p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDelete(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Post Body / Editing Form */}
        {isEditing ? (
          <div className="space-y-3 pt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {editContent.length} / 1000
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleUpdate}
                  disabled={loading || !editContent.trim()}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed break-words">
            {post.content}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

