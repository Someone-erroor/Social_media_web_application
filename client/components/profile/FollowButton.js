'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { profileService } from '@/services/profileService';
import { privacyService } from '@/services/privacyService';
import { useAuth } from '@/context/AuthContext';

/**
 * Production-ready Follow / Unfollow Button (Editorial Expression Theme)
 * Handles asynchronous relationship toggling, optimistic feedback, loading states,
 * and error rollback.
 */
export default function FollowButton({
  userId,
  isFollowing = false,
  isPending = false,
  onFollowChange,
  disabled = false,
  className = ''
}) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(isFollowing);
  const [pending, setPending] = useState(isPending);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Synchronize state if parent changes isFollowing or isPending
  if (isFollowing !== following && !loading) {
    setFollowing(isFollowing);
  }
  if (isPending !== pending && !loading) {
    setPending(isPending);
  }

  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setErrorMessage('Please sign in to follow creators.');
      return;
    }

    if (loading || disabled) return;

    setLoading(true);
    setErrorMessage('');
    const previousFollowing = following;
    const previousPending = pending;

    try {
      if (previousFollowing) {
        // Currently following -> Unfollow
        const res = await profileService.unfollowUser(userId);
        if (res?.success) {
          setFollowing(false);
          setPending(false);
          onFollowChange?.(false, res);
        } else {
          throw new Error(res?.message || 'Failed to unfollow user.');
        }
      } else if (previousPending) {
        // Currently requested -> Cancel request
        let res;
        try {
          res = await privacyService.cancelFollowRequest(userId);
        } catch (e) {
          res = await profileService.unfollowUser(userId);
        }
        if (res?.success) {
          setFollowing(false);
          setPending(false);
          onFollowChange?.(false, res);
        } else {
          throw new Error(res?.message || 'Failed to cancel follow request.');
        }
      } else {
        // Currently not following -> Follow
        const res = await profileService.followUser(userId);
        if (res?.success) {
          if (res.isPending) {
            setPending(true);
            setFollowing(false);
          } else {
            setFollowing(true);
            setPending(false);
          }
          onFollowChange?.(!res.isPending, res);
        } else {
          throw new Error(res?.message || 'Failed to follow user.');
        }
      }
    } catch (err) {
      setFollowing(previousFollowing);
      setPending(previousPending);
      setErrorMessage(err.message || 'Action could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-end">
      <Button
        type="button"
        variant={
          following
            ? isHovered
              ? 'danger'
              : 'outline'
            : pending
            ? isHovered
              ? 'danger'
              : 'outline'
            : 'primary'
        }
        size="sm"
        disabled={loading || disabled}
        onClick={handleToggleFollow}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`font-semibold min-w-[105px] transition-all duration-200 ${className}`}
        aria-label={following ? 'Unfollow this user' : pending ? 'Cancel follow request' : 'Follow this user'}
        aria-pressed={following || pending}
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Updating...</span>
          </span>
        ) : following ? (
          isHovered ? (
            <span className="flex items-center gap-1 text-[#FF6257]">
              <Icon name="close" className="w-3.5 h-3.5" />
              <span>Unfollow</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#D5F36A]">
              <Icon name="check" className="w-3.5 h-3.5 text-[#D5F36A]" />
              <span>Following</span>
            </span>
          )
        ) : pending ? (
          isHovered ? (
            <span className="flex items-center gap-1 text-[#FF6257]">
              <Icon name="close" className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#B9A8F5]">
              <Icon name="clock" className="w-3.5 h-3.5 text-[#B9A8F5]" />
              <span>Requested</span>
            </span>
          )
        ) : (
          <span className="flex items-center gap-1.5">
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>Follow</span>
          </span>
        )}
      </Button>

      {errorMessage && (
        <span className="text-[11px] text-[#FF6257] mt-1 font-medium animate-fade-in">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
