'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/posts/PostCard';
import PostComposer from '@/components/posts/PostComposer';
import { useAuth } from '@/context/AuthContext';
import { circleService } from '@/services/circleService';
import { ROUTES } from '@/lib/routes';

export default function CircleDetailPage({ params }) {
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;
  const { user } = useAuth();

  const [circle, setCircle] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [error, setError] = useState('');

  const loadCircle = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const res = await circleService.getCircleBySlug(slug);
      if (res?.success) {
        setCircle(res.circle);
        // Load posts for this circle
        if (res.circle?._id) {
          setLoadingPosts(true);
          const postsRes = await circleService.getCirclePosts(res.circle._id);
          if (postsRes?.success) {
            setPosts(postsRes.posts || []);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load circle details.');
    } finally {
      setLoading(false);
      setLoadingPosts(false);
    }
  }, [slug]);

  useEffect(() => {
    loadCircle();
  }, [loadCircle]);

  const handleJoinLeave = async () => {
    if (!circle) return;
    const isMember = circle.members?.some((m) => (m._id || m) === user?._id);
    try {
      if (isMember) {
        await circleService.leaveCircle(circle._id);
      } else {
        await circleService.joinCircle(circle._id);
      }
      loadCircle();
    } catch (err) {
      setError(err.message || 'Failed to update membership.');
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-32 rounded-2xl bg-[#1E1B26] border border-[#2D2938]" />
        <div className="h-24 rounded-2xl bg-[#1E1B26] border border-[#2D2938]" />
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] max-w-md mx-auto">
          {error || 'Circle not found.'}
        </div>
        <Button href={ROUTES.USER.CIRCLES} variant="outline" size="sm">
          Back to Circles
        </Button>
      </div>
    );
  }

  const isMember = circle.members?.some((m) => (m._id || m) === user?._id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Circle Banner Header */}
      <div className="p-6 rounded-2xl bg-[#1E1B26] border border-[#2D2938] relative overflow-hidden space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={ROUTES.USER.CIRCLES}
            className="inline-flex items-center gap-1.5 text-xs text-[#777580] hover:text-[#FF6257] transition-colors"
          >
            <Icon name="arrowLeft" className="w-4 h-4" />
            All Circles
          </Link>
          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B9A8F5]/15 text-[#B9A8F5] border border-[#B9A8F5]/30">
            {circle.category}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#F6F2EA] font-display">
              {circle.name}
            </h1>
            <p className="text-xs text-[#777580] max-w-xl leading-relaxed">
              {circle.description}
            </p>
          </div>

          <Button
            type="button"
            variant={isMember ? 'outline' : 'primary'}
            size="md"
            onClick={handleJoinLeave}
            className="self-start sm:self-auto shrink-0 shadow-lg shadow-coral-500/10"
          >
            {isMember ? 'Leave Circle' : 'Join Circle'}
          </Button>
        </div>

        <div className="pt-3 border-t border-[#2D2938] flex items-center gap-4 text-xs text-[#777580]">
          <span className="flex items-center gap-1.5">
            <Icon name="users" className="w-4 h-4 text-[#D5F36A]" />
            {circle.membersCount || circle.members?.length || 1} Community Members
          </span>
          <span>•</span>
          <span>Created by {circle.creator?.fullName || 'Creator'}</span>
        </div>
      </div>

      {/* Post Composer for Circle Members */}
      {isMember ? (
        <PostComposer onPostCreated={handlePostCreated} defaultCircleId={circle._id} />
      ) : (
        <div className="p-4 rounded-xl bg-[#1E1B26] border border-[#2D2938] flex items-center justify-between text-xs text-[#777580]">
          <span>Join this circle to contribute to discussions and share posts.</span>
          <Button type="button" size="sm" variant="primary" onClick={handleJoinLeave}>
            Join Now
          </Button>
        </div>
      )}

      {/* Circle Discussion Feed */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#F6F2EA] font-display flex items-center gap-2">
          <Icon name="feed" className="w-4 h-4 text-[#FF6257]" />
          Circle Discussions ({posts.length})
        </h2>

        {loadingPosts ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] animate-pulse h-28" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon="feed"
            title="No Discussions Yet"
            description="Start the conversation! Be the first member to share a post in this circle."
            badgeText={circle.name}
          />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}
