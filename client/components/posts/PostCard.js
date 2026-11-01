'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthContext';
import { postService } from '@/services/postService';
import { aiService } from '@/services/aiService';
import DiscussionSummaryPanel from '@/components/ai/DiscussionSummaryPanel';
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

  // Post edit / delete state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Like interaction state (Phase 10)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Comments state (Phase 10)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [submittingEditComment, setSubmittingEditComment] = useState(false);
  const [commentErrorMessage, setCommentErrorMessage] = useState('');

  // AI Discussion Summary state (Phase 15)
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryMetadata, setSummaryMetadata] = useState(null);

  // AI Discussion Summarization (Phase 15)
  const handleSummarizeDiscussion = async () => {
    if (!user) {
      setErrorMessage('Please sign in to summarize discussions.');
      return;
    }
    if (!user.isEmailVerified) {
      setErrorMessage('Please verify your email address to use AI summarization.');
      return;
    }

    setShowSummary(true);
    setSummaryLoading(true);
    setSummaryError('');

    try {
      const res = await aiService.summarizeDiscussion(post._id);
      if (res?.success) {
        setSummary(res.summary);
        setSummaryMetadata(res.metadata);
      } else {
        setSummaryError(res?.message || 'Failed to summarize discussion.');
      }
    } catch (err) {
      setSummaryError(err.message || 'Error occurred while contacting Gemini AI.');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Fetch like status if not provided by backend projection
  useEffect(() => {
    let isMounted = true;
    if (user && post.hasLiked === undefined) {
      postService.getPostLikes(post._id)
        .then((res) => {
          if (isMounted) {
            setHasLiked(Boolean(res.hasLiked));
            if (typeof res.likesCount === 'number') {
              setLikesCount(res.likesCount);
            }
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [user, post._id, post.hasLiked]);

  // Load comments when section is opened
  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length === 0) {
      setLoadingComments(true);
      setCommentErrorMessage('');
      try {
        const res = await postService.getComments(post._id);
        setComments(res.comments || []);
        if (typeof res.pagination?.total === 'number') {
          setCommentsCount(res.pagination.total);
        }
      } catch (err) {
        setCommentErrorMessage(err.message || 'Failed to load comments.');
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Optimistic like toggle
  const handleToggleLike = async () => {
    if (!user) {
      setErrorMessage('Please sign in to like posts.');
      return;
    }
    if (!user.isEmailVerified) {
      setErrorMessage('Please verify your email address to like posts.');
      return;
    }
    if (likeLoading) return;

    const prevHasLiked = hasLiked;
    const prevCount = likesCount;

    // Optimistic UI state
    setHasLiked(!prevHasLiked);
    setLikesCount(prevHasLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setLikeLoading(true);
    setErrorMessage('');

    try {
      if (prevHasLiked) {
        const res = await postService.unlikePost(post._id);
        setLikesCount(res.likesCount);
        setHasLiked(res.hasLiked);
      } else {
        const res = await postService.likePost(post._id);
        setLikesCount(res.likesCount);
        setHasLiked(res.hasLiked);
      }
    } catch (err) {
      // Revert on error
      setHasLiked(prevHasLiked);
      setLikesCount(prevCount);
      setErrorMessage(err.message || 'Failed to update like status.');
    } finally {
      setLikeLoading(false);
    }
  };

  // Submit new comment
  const handleAddComment = async (e) => {
    e?.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    if (!user) {
      setCommentErrorMessage('Please sign in to comment.');
      return;
    }
    if (!user.isEmailVerified) {
      setCommentErrorMessage('Please verify your email address to comment.');
      return;
    }

    setSubmittingComment(true);
    setCommentErrorMessage('');

    try {
      const res = await postService.createComment(post._id, { content: trimmed });
      setComments((prev) => [res.comment, ...prev]);
      setCommentsCount((c) => c + 1);
      setCommentText('');
    } catch (err) {
      setCommentErrorMessage(err.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Save comment edit
  const handleSaveEditComment = async (commentId) => {
    const trimmed = editCommentContent.trim();
    if (!trimmed) return;

    setSubmittingEditComment(true);
    setCommentErrorMessage('');

    try {
      const res = await postService.updateComment(commentId, { content: trimmed });
      setComments((prev) => prev.map((c) => (c._id === commentId ? res.comment : c)));
      setEditingCommentId(null);
      setEditCommentContent('');
    } catch (err) {
      setCommentErrorMessage(err.message || 'Failed to update comment.');
    } finally {
      setSubmittingEditComment(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      await postService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentsCount((c) => Math.max(0, c - 1));
    } catch (err) {
      setCommentErrorMessage(err.message || 'Failed to delete comment.');
    }
  };

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
    <Card className="border-[#E3E8E8] shadow-xs hover:border-[#16B8C8]/40 transition-colors">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Post Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={authorId ? ROUTES.USER.USER_PROFILE(authorId) : ROUTES.USER.FEED}
              tabIndex={-1}
              aria-hidden="true"
            >
              <Avatar
                name={authorName}
                src={authorAvatar}
                size="md"
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={authorId ? ROUTES.USER.USER_PROFILE(authorId) : ROUTES.USER.FEED}
                className="text-sm font-semibold text-[#172126] hover:text-[#087F8A] truncate block transition-colors"
              >
                {authorName}
              </Link>
              <span className="text-xs text-[#58666D]">
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
                className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-[#58666D] hover:text-[#076C76] hover:bg-[#F6F8F7] transition-colors" aria-label="Edit post"
                title="Edit post"
              >
                <Icon name="edit" className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-[#58666D] hover:text-red-600 hover:bg-red-50 transition-colors" aria-label="Delete post"
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
              className="w-full resize-none rounded-xl border border-[#E3E8E8] bg-white p-3 text-sm text-[#172126] focus:outline-none focus:border-[#16B8C8]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#68757C]">
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
          <p className="text-sm text-[#252E34] whitespace-pre-wrap leading-relaxed break-words">
            {post.content}
          </p>
        )}

        {/* Interaction Actions Bar (Phase 10: Likes & Comments) */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E3E8E8] text-xs text-[#58666D]">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
                hasLiked
                  ? 'text-red-600 bg-red-50 hover:bg-red-100 font-semibold'
                  : 'text-[#58666D] hover:text-red-600 hover:bg-[#F6F8F7]'
              }`}
              title={hasLiked ? 'Unlike post' : 'Like post'}
            >
              <Icon
                name="heart"
                className={`w-4 h-4 transition-transform ${hasLiked ? 'fill-red-600 stroke-red-600 animate-heart-pop' : ''}`}
              />
              <span>{likesCount}</span>
            </button>

            {/* Comments Toggle Button */}
            <button
              type="button"
              onClick={handleToggleComments}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                showComments
                  ? 'text-[#076C76] bg-cyan-50 font-semibold'
                  : 'text-[#58666D] hover:text-[#076C76] hover:bg-[#F6F8F7]'
              }`}
              title="View comments"
            >
              <Icon name="comments" className="w-4 h-4" />
              <span>{commentsCount}</span>
            </button>

            {/* AI Discussion Summarize Button (Phase 15) */}
            <button
              type="button"
              onClick={handleSummarizeDiscussion}
              disabled={summaryLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs ${
                showSummary
                  ? 'text-[#FF725E] bg-[#FF725E]/10 font-semibold'
                  : 'text-[#58666D] hover:text-[#FF725E] hover:bg-[#F6F8F7]'
              }`}
              title="Summarize discussion with Gemini AI"
              aria-label="Summarize discussion"
            >
              <Icon
                name="sparkles"
                className={`w-4 h-4 text-[#FF725E] ${summaryLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Summarize</span>
            </button>
          </div>
        </div>

        {/* Discussion Summary Panel (Phase 15) */}
        {showSummary && (
          <DiscussionSummaryPanel
            summary={summary}
            loading={summaryLoading}
            error={summaryError}
            metadata={summaryMetadata}
            onClose={() => setShowSummary(false)}
            onRetry={handleSummarizeDiscussion}
          />
        )}

        {/* Expandable Comments Section (Phase 10) */}
        {showComments && (
          <div className="pt-3 border-t border-[#E3E8E8] space-y-4">
            {commentErrorMessage && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {commentErrorMessage}
              </div>
            )}

            {/* Comment Composer */}
            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-2.5">
                <Avatar
                  name={user.fullName}
                  src={user.profile?.avatarUrl}
                  size="sm"
                  className="shrink-0 mt-0.5"
                />
                <div className="flex-1 space-y-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      aria-label="Write a comment"
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      maxLength={500}
                      disabled={submittingComment}
                      className="w-full rounded-xl border border-[#E3E8E8] bg-[#F6F8F7]/60 px-3 py-2 text-xs text-[#252E34] placeholder:text-[#68757C] focus:outline-none focus:border-[#16B8C8] focus:bg-white"
                    />
                  </div>
                  {commentText.length > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-[#58666D]">
                      <span>{commentText.length} / 500</span>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={submittingComment || !commentText.trim()}
                      >
                        {submittingComment ? 'Posting...' : 'Comment'}
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#F6F8F7] border border-[#E3E8E8] text-center text-xs text-[#58666D]">
                <Link href={ROUTES.AUTH.LOGIN} className="text-[#076C76] font-semibold hover:underline">
                  Sign in
                </Link>{' '}
                to join the discussion and post a comment.
              </div>
            )}

            {/* Comments List */}
            {loadingComments ? (
              <div className="py-4 text-center text-xs text-[#58666D]">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <p className="py-2 text-center text-xs text-[#58666D]">
                No comments yet. Be the first to start the conversation!
              </p>
            ) : (
              <div className="space-y-3 pt-1">
                {comments.map((comment) => {
                  const commentAuthor = comment.author || {};
                  const commentAuthorId = commentAuthor._id || comment.author;
                  const commentAuthorName = commentAuthor.fullName || 'User';
                  const commentAuthorAvatar = commentAuthor.profile?.avatarUrl || '';
                  const isCommentOwner = user && (user._id === commentAuthorId || user.id === commentAuthorId);
                  const isEditingThis = editingCommentId === comment._id;

                  return (
                    <div key={comment._id} className="flex gap-2.5 group text-xs">
                      <Link
                        href={commentAuthorId ? ROUTES.USER.USER_PROFILE(commentAuthorId) : ROUTES.USER.FEED}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <Avatar
                          name={commentAuthorName}
                          src={commentAuthorAvatar}
                          size="sm"
                          className="shrink-0 mt-0.5"
                        />
                      </Link>

                      <div className="flex-1 bg-[#F6F8F7] rounded-xl p-2.5 border border-[#E3E8E8]">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={commentAuthorId ? ROUTES.USER.USER_PROFILE(commentAuthorId) : ROUTES.USER.FEED}
                            className="font-semibold text-[#172126] hover:text-[#087F8A] transition-colors"
                          >
                            {commentAuthorName}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#58666D]">
                            <span>{formatTimestamp(comment.createdAt)}</span>
                            {isCommentOwner && !isEditingThis && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(comment._id);
                                    setEditCommentContent(comment.content);
                                  }}
                                  className="text-[#68757C] hover:text-[#087F8A] p-1 min-w-[24px] min-h-[24px] flex items-center justify-center" aria-label="Edit comment"
                                  title="Edit comment"
                                >
                                  <Icon name="edit" className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="text-[#68757C] hover:text-red-600 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center" aria-label="Delete comment"
                                  title="Delete comment"
                                >
                                  <Icon name="trash" className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Comment Content / Edit Form */}
                        {isEditingThis ? (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              aria-label="Edit comment content"
                              value={editCommentContent}
                              onChange={(e) => setEditCommentContent(e.target.value)}
                              maxLength={500}
                              disabled={submittingEditComment}
                              className="w-full rounded-lg border border-[#E3E8E8] bg-white p-2 text-xs text-[#172126] focus:outline-none focus:border-[#16B8C8]"
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingCommentId(null)}
                                disabled={submittingEditComment}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => handleSaveEditComment(comment._id)}
                                disabled={submittingEditComment || !editCommentContent.trim()}
                              >
                                {submittingEditComment ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-1 text-[#252E34] whitespace-pre-wrap break-words leading-relaxed">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
