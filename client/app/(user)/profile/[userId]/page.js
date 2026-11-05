'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/posts/PostCard';
import FollowButton from '@/components/profile/FollowButton';
import UserListModal from '@/components/profile/UserListModal';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';
import { postService } from '@/services/postService';
import { ROUTES } from '@/lib/routes';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.userId;
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [postsError, setPostsError] = useState('');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // User list modal state (Followers / Following)
  const [userListModalOpen, setUserListModalOpen] = useState(false);
  const [userListType, setUserListType] = useState('followers');
  const [userListUsers, setUserListUsers] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);

  const isOwnProfile = currentUser && (currentUser._id === userId || currentUser.id === userId);

  useEffect(() => {
    let ignore = false;
    if (userId) {
      const profilePromise = profileService
        .getPublicProfile(userId)
        .then((profileRes) => {
          if (!ignore) {
            setProfile(profileRes?.profile || null);
            setErrorMessage('');
          }
        })
        .catch((err) => {
          if (!ignore) {
            setErrorMessage(err.message || 'User profile not found.');
          }
        });

      const postsPromise = postService
        .getUserPosts(userId, { page: 1, limit: 20 })
        .then((postsRes) => {
          if (!ignore) {
            setPosts(postsRes?.posts || []);
            setPostsError('');
          }
        })
        .catch((err) => {
          if (!ignore) {
            setPostsError(err.message || 'Failed to load posts published by this member.');
          }
        });

      Promise.allSettled([profilePromise, postsPromise]).finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    }

    return () => {
      ignore = true;
    };
  }, [userId, reloadTrigger]);

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleFollowChange = useCallback((isFollowing, result) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        isFollowing,
        followersCount:
          typeof result?.followersCount === 'number'
            ? result.followersCount
            : isFollowing
            ? (prev.followersCount || 0) + 1
            : Math.max(0, (prev.followersCount || 1) - 1)
      };
    });
  }, []);

  const handleOpenFollowers = async () => {
    setUserListType('followers');
    setUserListModalOpen(true);
    setUserListLoading(true);
    try {
      const res = await profileService.getFollowers(userId);
      setUserListUsers(res?.followers || []);
    } catch {
      setUserListUsers([]);
    } finally {
      setUserListLoading(false);
    }
  };

  const handleOpenFollowing = async () => {
    setUserListType('following');
    setUserListModalOpen(true);
    setUserListLoading(true);
    try {
      const res = await profileService.getFollowing(userId);
      setUserListUsers(res?.following || []);
    } catch {
      setUserListUsers([]);
    } finally {
      setUserListLoading(false);
    }
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric'
      })
    : '';

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile ? profile.fullName : 'Member Profile'}
        description="Community presence on Looply"
        action={
          <Button
            href={ROUTES.USER.FEED}
            variant="ghost"
            size="sm"
            icon={<Icon name="arrowLeft" className="w-4 h-4" />}
          >
            Back to Feed
          </Button>
        }
      />

      {loading ? (
        <Card className="overflow-hidden border-[#263640] bg-[#151F29] animate-pulse">
          <div className="h-28 bg-[#1D2A35]" />
          <CardContent className="pt-0 pb-6 px-6">
            <div className="-mt-12 mb-4 w-24 h-24 rounded-full bg-[#1D2A35] ring-4 ring-[#101A22]" />
            <div className="space-y-2">
              <div className="w-48 h-5 bg-[#1D2A35] rounded" />
              <div className="w-64 h-3 bg-[#1D2A35]/60 rounded" />
            </div>
          </CardContent>
        </Card>
      ) : errorMessage || !profile ? (
        <EmptyState
          icon="profile"
          title="Profile Not Found"
          description={errorMessage || 'The requested user profile does not exist or is no longer active on Looply.'}
          action={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  setErrorMessage('');
                  setReloadTrigger((n) => n + 1);
                }}
              >
                Retry
              </Button>
              <Button href={ROUTES.USER.FEED} variant="primary" size="sm">
                Return to Feed
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {/* Profile Header Card */}
          <Card className="overflow-hidden border-[#263640] bg-[#151F29] shadow-lg shadow-black/40">
            <div className="h-28 bg-gradient-to-r from-[#19D3E3]/60 via-[#101A22] to-[#FF6F61]/60" />

            <CardContent className="relative pt-0 pb-6 px-6">
              <div className="-mt-12 mb-4 flex items-end justify-between gap-3">
                <div className="rounded-full ring-4 ring-[#101A22] bg-[#101A22]">
                  <Avatar
                    name={profile.fullName}
                    src={profile.profile?.avatarUrl}
                    size="xl"
                  />
                </div>

                <div className="pt-2">
                  {isOwnProfile ? (
                    <Button
                      href={ROUTES.USER.PROFILE_EDIT}
                      variant="outline"
                      size="sm"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <FollowButton
                      userId={userId}
                      isFollowing={Boolean(profile.isFollowing)}
                      onFollowChange={handleFollowChange}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h1 className="text-xl font-bold text-[#F4F8FA]">
                    {profile.fullName}
                  </h1>
                  {memberSince && (
                    <p className="text-xs text-[#9BAAB4]">Member since {memberSince}</p>
                  )}
                </div>

                {profile.profile?.bio ? (
                  <p className="text-sm text-[#9BAAB4] max-w-xl leading-relaxed">
                    {profile.profile.bio}
                  </p>
                ) : (
                  <p className="text-xs italic text-[#9BAAB4]">
                    This member has not written a bio yet.
                  </p>
                )}

                {/* Follower / Following Metrics Bar */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-[#263640] text-xs">
                  <button
                    type="button"
                    onClick={handleOpenFollowers}
                    className="flex items-center gap-1.5 text-[#9BAAB4] hover:text-[#19D3E3] transition-colors cursor-pointer group py-1"
                    title="View followers"
                  >
                    <span className="font-bold text-[#F4F8FA] text-sm group-hover:text-[#19D3E3]">
                      {profile.followersCount ?? 0}
                    </span>
                    <span>Followers</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenFollowing}
                    className="flex items-center gap-1.5 text-[#9BAAB4] hover:text-[#19D3E3] transition-colors cursor-pointer group py-1"
                    title="View following"
                  >
                    <span className="font-bold text-[#F4F8FA] text-sm group-hover:text-[#19D3E3]">
                      {profile.followingCount ?? 0}
                    </span>
                    <span>Following</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Posts Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[#F4F8FA]">
              Posts by {profile.fullName} ({posts.length})
            </h2>

            {postsError ? (
              <div className="p-4 rounded-xl bg-[#FF6F61]/10 border border-[#FF6F61]/30 text-xs text-[#FF6F61]">
                {postsError}
              </div>
            ) : posts.length === 0 ? (
              <EmptyState
                icon="posts"
                title="No Publications Yet"
                description={`${profile.fullName} has not published any posts on Looply yet.`}
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
              </div>
            )}
          </div>

          {/* Followers / Following List Modal */}
          <UserListModal
            isOpen={userListModalOpen}
            onClose={() => setUserListModalOpen(false)}
            type={userListType}
            users={userListUsers}
            loading={userListLoading}
            profileName={profile.fullName}
          />
        </>
      )}
    </div>
  );
}
