'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Badge from '@/components/ui/Badge';
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
  const authorName = typeof post.author === 'object' ? post.author?.fullName : 'Looply Creator';
  const authorAvatar = typeof post.author === 'object' ? post.author?.profile?.avatarUrl : '';

  const isOwner = Boolean(user && (user._id === authorId || user.id === authorId));

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

  // Sync like count and liked status if post prop updates
  useEffect(() => {
    if (typeof post.likesCount === 'number') {
      setLikesCount(post.likesCount);
    }
    if (typeof post.hasLiked === 'boolean') {
      setHasLiked(post.hasLiked);
    }
  }, [post.likesCount, post.hasLiked]);

  // Fetch like status if not provided by backend projection
  useEffect(() => {
    let isMounted = true;
    if (user && post.hasLiked === undefined) {
      postService
        .getPostLikes(post._id)
        .then((res) => {
          if (isMounted && res) {
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

  // Toggle post like with optimistic update and failure rollback
  const handleToggleLike = async () => {
    if (!user) {
      setErrorMessage('Please sign in to like posts.');
      return;
    }
    if (likeLoading) return;

    const previousLiked = hasLiked;
    const previousCount = likesCount;

    // Optimistic state
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
      // Rollback on failure
      setHasLiked(previousLiked);
      setLikesCount(previousCount);
      setErrorMessage(err.message || 'Failed to update like status.');
    } finally {
      setLikeLoading(false);
    }
  };

  // Toggle comments panel and fetch comments if empty
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
    if (submittingComment) return;

    const trimmed = commentText.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      setCommentErrorMessage('Comment cannot exceed 500 characters.');
      return;
    }

    setSubmittingComment(true);
    setCommentErrorMessage('');

    try {
      const res = await postService.createComment(post._id, { content: trimmed });
      if (res?.success && res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setCommentsCount((c) => c + 1);
        setCommentText('');
      } else {
        throw new Error(res?.message || 'Unable to publish comment.');
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

  const isSplitReality = post.postType === 'splitReality' && post.primaryMedia && post.realityMedia;

  return (
    <article aria-label={`Post by ${authorName}`}>
      <Card className="border-[#2D2938] bg-[#1E1B26] shadow-xl hover:border-[#2D2938]/80 transition-all">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-[#777580] hover:text-[#F6F2EA] font-bold p-1 cursor-pointer"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Post Header: Author, Metadata & Context Actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={authorId ? ROUTES.USER.USER_PROFILE(authorId) : ROUTES.USER.FEED}
                tabIndex={-1}
                aria-hidden="true"
                className="shrink-0"
              >
                <Avatar
                  name={authorName}
                  src={authorAvatar}
                  size="md"
                />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={authorId ? ROUTES.USER.USER_PROFILE(authorId) : ROUTES.USER.FEED}
                    className="text-sm font-bold text-[#F6F2EA] hover:text-[#FF6257] font-display truncate transition-colors"
                  >
                    {authorName}
                  </Link>

                  {isSplitReality && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6257]/15 text-[#FF6257] border border-[#FF6257]/30 font-display">
                      <Icon name="split" className="w-2.5 h-2.5 text-[#FF6257]" />
                      Split-Reality
                    </span>
                  )}

                  {post.recommendationBadge && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D5F36A]/10 text-[#D5F36A] border border-[#D5F36A]/20">
                      <Icon name="sparkles" className="w-2.5 h-2.5" />
                      {post.recommendationBadge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[#777580] pt-0.5">
                  <time
                    dateTime={post.createdAt}
                    title={post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
                  >
                    {formatTimestamp(post.createdAt)}
                  </time>
                  {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <span className="text-[11px] text-[#777580]/70">• edited</span>
                  )}
                  {post.circle && (
                    <>
                      <span>•</span>
                      <Link
                        href={ROUTES.USER.CIRCLE_DETAIL(post.circle.slug || post.circle)}
                        className="text-[#D5F36A] hover:underline truncate max-w-[120px]"
                      >
                        {post.circle.name || 'Circle'}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Post Header Right Actions: Owner Controls or Report */}
            <div className="flex items-center gap-1 shrink-0">
              {isOwner && !isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditContent(post.content || '');
                      setIsEditing(true);
                      setShowConfirmDelete(false);
                    }}
                    className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-xl text-[#777580] hover:text-[#FF6257] hover:bg-[#24202E] transition-colors cursor-pointer"
                    aria-label="Edit post"
                    title="Edit post"
                  >
                    <Icon name="edit" className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-xl text-[#777580] hover:text-[#FF6257] hover:bg-[#FF6257]/10 transition-colors cursor-pointer"
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
                  className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-xl text-[#777580] hover:text-[#FF6257] hover:bg-[#FF6257]/10 transition-colors cursor-pointer"
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
            <div className="p-3.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] space-y-2.5 animate-fade-in">
              <div className="flex items-center gap-2">
                <Icon name="alertCircle" className="w-4 h-4 shrink-0 text-[#FF6257]" />
                <p className="font-semibold text-[#F6F2EA]">Delete this post permanently?</p>
              </div>
              <p className="text-[11px] text-[#777580]">
                This post and associated likes and comments will be removed from your Loop.
              </p>
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

          {/* Post Content / Edit Mode */}
          {isEditing ? (
            <div className="space-y-3 pt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                disabled={loading}
                aria-label="Edit post content"
                className="w-full resize-none rounded-xl border border-[#2D2938] bg-[#17151D] p-3 text-xs sm:text-sm text-[#F6F2EA] focus:outline-none focus:border-[#FF6257]"
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
              {/* Split-Reality Signature Presentation */}
              {isSplitReality && (
                <div className="rounded-2xl overflow-hidden border border-[#2D2938] bg-[#110F17]">
                  <SplitRealityViewer
                    primaryMedia={post.primaryMedia}
                    realityMedia={post.realityMedia}
                  />
                </div>
              )}

              {/* Text Caption / Body */}
              {post.content && (
                <p className="text-xs sm:text-sm text-[#F6F2EA] whitespace-pre-wrap leading-relaxed break-words font-sans">
                  {post.content}
                </p>
              )}
            </div>
          )}

          {/* Interaction Bar: Likes, Comments, AI Summary */}
          <div className="flex items-center justify-between pt-3 border-t border-[#2D2938] text-xs text-[#777580]">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={likeLoading}
                aria-pressed={hasLiked}
                aria-label={hasLiked ? `Liked by you and ${likesCount - 1} others` : `Like this post, ${likesCount} likes`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer min-h-[36px] active:scale-95 ${
                  hasLiked
                    ? 'text-[#FF6257] bg-[#FF6257]/15 font-semibold ring-1 ring-[#FF6257]/30'
                    : 'text-[#777580] hover:text-[#FF6257] hover:bg-[#24202E]'
                }`}
                title={hasLiked ? 'Unlike post' : 'Like post'}
              >
                <Icon
                  name="heart"
                  className={`w-4 h-4 transition-transform ${
                    hasLiked ? 'fill-[#FF6257] stroke-[#FF6257]' : ''
                  }`}
                />
                <span className="font-semibold text-xs">{likesCount}</span>
              </button>

              {/* Comments Toggle Button */}
              <button
                type="button"
                onClick={handleToggleComments}
                aria-expanded={showComments}
                aria-label={`${commentsCount} comments. Click to expand`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer min-h-[36px] ${
                  showComments
                    ? 'text-[#B9A8F5] bg-[#B9A8F5]/15 font-semibold ring-1 ring-[#B9A8F5]/30'
                    : 'text-[#777580] hover:text-[#B9A8F5] hover:bg-[#24202E]'
                }`}
                title="View comments"
              >
                <Icon name="comments" className="w-4 h-4" />
                <span className="font-semibold text-xs">{commentsCount}</span>
              </button>

              {/* AI Discussion Summarize Button */}
              <button
                type="button"
                onClick={handleSummarizeDiscussion}
                disabled={summaryLoading}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors text-xs cursor-pointer min-h-[36px] ${
                  showSummary
                    ? 'text-[#D5F36A] bg-[#D5F36A]/15 font-semibold ring-1 ring-[#D5F36A]/30'
                    : 'text-[#777580] hover:text-[#D5F36A] hover:bg-[#24202E]'
                }`}
                title="Summarize discussion with Gemini AI"
                aria-label="Summarize discussion"
              >
                <Icon
                  name="sparkles"
                  className={`w-3.5 h-3.5 text-[#D5F36A] ${summaryLoading ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline font-medium">Summarize</span>
              </button>
            </div>
          </div>

          {/* AI Discussion Summary Panel */}
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
                <div className="p-2.5 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
                  {commentErrorMessage}
                </div>
              )}

              {/* Comment Composer */}
              {user ? (
                <form onSubmit={handleAddComment} className="flex gap-2.5 items-start">
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
                        placeholder="Join the discussion..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        maxLength={500}
                        disabled={submittingComment}
                        className="w-full rounded-xl border border-[#2D2938] bg-[#17151D] px-3.5 py-2 text-xs text-[#F6F2EA] placeholder:text-[#777580] focus:outline-none focus:border-[#FF6257]"
                      />
                    </div>
                    {commentText.length > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-[#777580] pt-0.5">
                        <span>{commentText.length} / 500 characters</span>
                        <Button
                          type="submit"
                          variant="primary"
                          size="xs"
                          disabled={submittingComment || !commentText.trim()}
                        >
                          {submittingComment ? 'Posting...' : 'Post Comment'}
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-[#17151D] border border-[#2D2938] text-center text-xs text-[#777580]">
                  <Link href={ROUTES.AUTH.LOGIN} className="text-[#FF6257] font-semibold hover:underline">
                    Sign in
                  </Link>{' '}
                  to participate in discussions.
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="py-4 text-center text-xs text-[#777580] animate-pulse">
                  Loading discussion...
                </div>
              ) : comments.length === 0 ? (
                <p className="py-2 text-center text-xs text-[#777580]">
                  No comments yet. Be the first to share your perspective!
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

                        <div className="flex-1 bg-[#17151D] rounded-xl p-3 border border-[#2D2938]">
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
                                  size="xs"
                                  onClick={() => setEditingCommentId(null)}
                                  disabled={submittingEditComment}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="xs"
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
    </article>
  );
}
