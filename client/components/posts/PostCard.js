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
import SplitRealityViewer from './SplitRealityViewer';
import { ROUTES } from '@/lib/routes';
import ReportModal from '@/components/safety/ReportModal';

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
  const [showReportModal, setShowReportModal] = useState(false);

  // Like interaction state
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Comments state
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
  const [reportingComment, setReportingComment] = useState(null);

  // AI Discussion Summary state
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [summaryMetadata, setSummaryMetadata] = useState(null);

  // AI Discussion Summarization
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
  }, [post._id, post.hasLiked, user]);

  // Toggle post like
  const handleToggleLike = async () => {
    if (!user) {
      setErrorMessage('Please sign in to like posts.');
      return;
    }

    const previousLiked = hasLiked;
    const previousCount = likesCount;

    setHasLiked(!previousLiked);
    setLikesCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);
    setLikeLoading(true);

    try {
      if (previousLiked) {
        const res = await postService.unlikePost(post._id);
        if (typeof res?.likesCount === 'number') {
          setLikesCount(res.likesCount);
        }
      } else {
        const res = await postService.likePost(post._id);
        if (typeof res?.likesCount === 'number') {
          setLikesCount(res.likesCount);
        }
      }
    } catch (err) {
      setHasLiked(previousLiked);
      setLikesCount(previousCount);
      setErrorMessage(err.message || 'Failed to update like status.');
    } finally {
      setLikeLoading(false);
    }
  };

  // Toggle comments and fetch comments
  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length === 0) {
      setLoadingComments(true);
      setCommentErrorMessage('');
      try {
        const res = await postService.getComments(post._id);
        if (res?.success) {
          setComments(res.comments || []);
          if (typeof res.pagination?.total === 'number') {
            setCommentsCount(res.pagination.total);
          }
        }
      } catch (err) {
        setCommentErrorMessage(err.message || 'Failed to load comments.');
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Add comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      setCommentErrorMessage('Please sign in to post a comment.');
      return;
    }
    if (!user.isEmailVerified) {
      setCommentErrorMessage('Please verify your email address to comment on posts.');
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      setCommentErrorMessage('Comment cannot exceed 500 characters.');
      return;
    }

    setSubmittingComment(true);
    setCommentErrorMessage('');

    try {
      const res = await postService.addComment(post._id, { content: trimmed });
      if (res?.success && res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setCommentsCount((c) => c + 1);
        setCommentText('');
      }
    } catch (err) {
      setCommentErrorMessage(err.message || 'Failed to publish comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Save edited comment
  const handleSaveEditComment = async (commentId) => {
    const trimmed = editCommentContent.trim();
    if (!trimmed) {
      setCommentErrorMessage('Comment cannot be empty.');
      return;
    }
    if (trimmed.length > 500) {
      setCommentErrorMessage('Comment cannot exceed 500 characters.');
      return;
    }

    setSubmittingEditComment(true);
    setCommentErrorMessage('');

    try {
      const res = await postService.updateComment(commentId, { content: trimmed });
      if (res?.success && res.comment) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? res.comment : c))
        );
        setEditingCommentId(null);
        setEditCommentContent('');
      }
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
    <Card className="border-[#2D2938] bg-[#1E1B26] shadow-xl interactive-card animate-fade-in">
      <CardContent className="p-4 sm:p-5 space-y-3">
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
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
                className="text-sm font-bold text-[#F6F2EA] hover:text-[#FF6257] font-display truncate block transition-colors"
              >
                {authorName}
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#777580]">
                  {formatTimestamp(post.createdAt)}
                  {post.updatedAt && post.updatedAt !== post.createdAt && ' (edited)'}
                </span>
                {post.recommendationBadge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D5F36A]/10 text-[#D5F36A] border border-[#D5F36A]/20">
                    <Icon name="sparkles" className="w-2.5 h-2.5" />
                    {post.recommendationBadge}
                  </span>
                )}
                {post.postType === 'splitReality' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30">
                    <Icon name="split" className="w-2.5 h-2.5 text-[#FF6257]" />
                    Split-Reality
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Post Actions: Owner Controls or Report */}
          <div className="flex items-center gap-1 shrink-0">
            {isOwner && !isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditContent(post.content);
                    setIsEditing(true);
                    setShowConfirmDelete(false);
                  }}
                  className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-[#777580] hover:text-[#FF6257] hover:bg-[#24202E] transition-colors"
                  aria-label="Edit post"
                  title="Edit post"
                >
                  <Icon name="edit" className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-[#777580] hover:text-[#FF6257] hover:bg-[#FF6257]/10 transition-colors"
                  aria-label="Delete post"
                  title="Delete post"
                >
                  <Icon name="trash" className="w-4 h-4" />
                </button>
              </>
            )}

            {!isOwner && user && (
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-lg text-[#777580] hover:text-[#FF6257] hover:bg-[#FF6257]/10 transition-colors"
                aria-label="Report post"
                title="Report post"
              >
                <Icon name="flag" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {showConfirmDelete && (
          <div className="p-3 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] space-y-2 animate-fade-in">
            <p className="font-semibold text-[#F6F2EA]">Delete this post?</p>
            <p className="text-[#FF6257]">This action cannot be undone.</p>
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
              className="w-full resize-none rounded-xl border border-[#2D2938] bg-[#17151D] p-3 text-sm text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#777580]">
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
          <div className="space-y-3">
            {post.postType === 'splitReality' && post.primaryMedia && post.realityMedia && (
              <SplitRealityViewer
                primaryMedia={post.primaryMedia}
                realityMedia={post.realityMedia}
              />
            )}
            {post.content && (
              <p className="text-sm text-[#F6F2EA] whitespace-pre-wrap leading-relaxed break-words">
                {post.content}
              </p>
            )}
          </div>
        )}

        {/* Interaction Actions Bar (Likes, Comments, AI Summarize) */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2D2938] text-xs text-[#777580]">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 ${
                hasLiked
                  ? 'text-[#FF6257] bg-[#FF6257]/15 font-semibold ring-1 ring-[#FF6257]/30'
                  : 'text-[#777580] hover:text-[#FF6257] hover:bg-[#24202E]'
              }`}
              title={hasLiked ? 'Unlike post' : 'Like post'}
            >
              <Icon
                name="heart"
                className={`w-4 h-4 transition-transform ${hasLiked ? 'fill-[#FF6257] stroke-[#FF6257] animate-heart-pop' : ''}`}
              />
              <span>{likesCount}</span>
            </button>

            {/* Comments Toggle Button */}
            <button
              type="button"
              onClick={handleToggleComments}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                showComments
                  ? 'text-[#B9A8F5] bg-[#B9A8F5]/15 font-semibold ring-1 ring-[#B9A8F5]/30'
                  : 'text-[#777580] hover:text-[#B9A8F5] hover:bg-[#24202E]'
              }`}
              title="View comments"
            >
              <Icon name="comments" className="w-4 h-4" />
              <span>{commentsCount}</span>
            </button>

            {/* AI Discussion Summarize Button */}
            <button
              type="button"
              onClick={handleSummarizeDiscussion}
              disabled={summaryLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs ${
                showSummary
                  ? 'text-[#D5F36A] bg-[#D5F36A]/15 font-semibold ring-1 ring-[#D5F36A]/30'
                  : 'text-[#777580] hover:text-[#D5F36A] hover:bg-[#24202E]'
              }`}
              title="Summarize discussion with Gemini AI"
              aria-label="Summarize discussion"
            >
              <Icon
                name="sparkles"
                className={`w-4 h-4 text-[#D5F36A] ${summaryLoading ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Summarize</span>
            </button>
          </div>
        </div>

        {/* Discussion Summary Panel */}
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

        {/* Expandable Comments Section */}
        {showComments && (
          <div className="pt-3 border-t border-[#2D2938] space-y-4 animate-fade-in">
            {commentErrorMessage && (
              <div className="p-2 rounded-lg bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
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
                      className="w-full rounded-xl border border-[#2D2938] bg-[#17151D] px-3 py-2 text-xs text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#FF6257]"
                    />
                  </div>
                  {commentText.length > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-[#777580]">
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
              <div className="p-2.5 rounded-xl bg-[#17151D] border border-[#2D2938] text-center text-xs text-[#777580]">
                <Link href={ROUTES.AUTH.LOGIN} className="text-[#FF6257] font-semibold hover:underline">
                  Sign in
                </Link>{' '}
                to join the discussion and post a comment.
              </div>
            )}

            {/* Comments List */}
            {loadingComments ? (
              <div className="py-4 text-center text-xs text-[#777580]">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <p className="py-2 text-center text-xs text-[#777580]">
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

                      <div className="flex-1 bg-[#17151D] rounded-xl p-2.5 border border-[#2D2938]">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={commentAuthorId ? ROUTES.USER.USER_PROFILE(commentAuthorId) : ROUTES.USER.FEED}
                            className="font-bold text-[#F6F2EA] hover:text-[#FF6257] transition-colors"
                          >
                            {commentAuthorName}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#777580]">
                            <span>{formatTimestamp(comment.createdAt)}</span>
                            {isCommentOwner && !isEditingThis && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(comment._id);
                                    setEditCommentContent(comment.content);
                                  }}
                                  className="text-[#777580] hover:text-[#FF6257] p-1 min-w-[24px] min-h-[24px] flex items-center justify-center cursor-pointer"
                                  aria-label="Edit comment"
                                  title="Edit comment"
                                >
                                  <Icon name="edit" className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="text-[#777580] hover:text-[#FF6257] p-1 min-w-[24px] min-h-[24px] flex items-center justify-center cursor-pointer"
                                  aria-label="Delete comment"
                                  title="Delete comment"
                                >
                                  <Icon name="trash" className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            {!isCommentOwner && user && !isEditingThis && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                                <button
                                  type="button"
                                  onClick={() => setReportingComment(comment)}
                                  className="text-[#777580] hover:text-[#FF6257] p-1 min-w-[24px] min-h-[24px] flex items-center justify-center cursor-pointer"
                                  aria-label="Report comment"
                                  title="Report comment"
                                >
                                  <Icon name="flag" className="w-3 h-3" />
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
                              className="w-full rounded-lg border border-[#2D2938] bg-[#1E1B26] p-2 text-xs text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
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
                          <p className="mt-1 text-[#F6F2EA] whitespace-pre-wrap break-words leading-relaxed">
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

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetId={post._id}
        targetName={authorName}
      />

      <ReportModal
        isOpen={Boolean(reportingComment)}
        onClose={() => setReportingComment(null)}
        targetType="comment"
        targetId={reportingComment?._id}
        targetName={`comment by ${reportingComment?.author?.fullName || 'User'}`}
      />
    </Card>
  );
}
