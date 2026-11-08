'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/posts/PostCard';
import FollowButton from '@/components/profile/FollowButton';
import UserListModal from '@/components/profile/UserListModal';
import ReportModal from '@/components/safety/ReportModal';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';
import { postService } from '@/services/postService';
import { messageService } from '@/services/messageService';
import { safetyService } from '@/services/safetyService';
import { ROUTES } from '@/lib/routes';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
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
  const [showReportModal, setShowReportModal] = useState(false);

  const isOwnProfile = currentUser && (currentUser._id === userId || currentUser.id === userId);

  const handleStartMessage = async () => {
    try {
      const res = await messageService.getOrCreateConversation(userId);
      const convId = res?.conversation?._id || '';
      if (convId) {
        router.push(`${ROUTES.USER.MESSAGES}?conversationId=${convId}&userId=${userId}`);
      } else {
        router.push(`${ROUTES.USER.MESSAGES}?userId=${userId}`);
      }
    } catch {
      router.push(`${ROUTES.USER.MESSAGES}?userId=${userId}`);
    }
  };

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

  const handleFollowChange = (newFollowStatus, res) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const currentCount = prev.followersCount ?? 0;
      return {
        ...prev,
        isFollowing: newFollowStatus,
        isPending: Boolean(res?.isPending),
        followersCount: newFollowStatus ? currentCount + 1 : Math.max(0, currentCount - 1)
      };
    });
  };

  const handleOpenFollowers = async () => {
    if (!userId) return;
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
    if (!userId) return;
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
        title={profile ? profile.fullName : 'Profile'}
        description={
          profile
            ? `Explore ${profile.fullName}'s presence, activity, and thoughts on Looply`
            : 'Viewing member profile on Looply'
        }
      />

      {loading ? (
        <Card className="overflow-hidden border-[#2D2938] bg-[#1E1B26] animate-pulse">
          <div className="h-28 bg-[#24202E]" />
          <CardContent className="pt-0 pb-6 px-6">
            <div className="-mt-12 mb-4 w-24 h-24 rounded-full bg-[#24202E] ring-4 ring-[#17151D]" />
            <div className="space-y-2">
              <div className="w-48 h-5 bg-[#24202E] rounded" />
              <div className="w-64 h-3 bg-[#24202E]/60 rounded" />
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
          <Card className="overflow-hidden border-[#2D2938] bg-[#1E1B26] shadow-xl shadow-black/50">
            <div className="h-28 bg-gradient-to-r from-[#FF6257]/70 via-[#17151D] to-[#B9A8F5]/70" />

            <CardContent className="relative pt-0 pb-6 px-6">
              <div className="-mt-12 mb-4 flex items-end justify-between gap-3">
                <div className="rounded-full ring-4 ring-[#17151D] bg-[#17151D]">
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
                    <div className="flex items-center gap-2">
                      <FollowButton
                        userId={userId}
                        isFollowing={Boolean(profile.isFollowing)}
                        isPending={Boolean(profile.isPending)}
                        onFollowChange={handleFollowChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleStartMessage}
                        className="flex items-center gap-1.5"
                      >
                        <Icon name="message" className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Message</span>
                      </Button>
                      <Button
                        href={ROUTES.USER.MEMORIES(userId)}
                        variant="ghost"
                        size="sm"
                        className="px-2 text-[#B9A8F5] hover:text-[#D5F36A]"
                        title="Friendship Memories"
                      >
                        <Icon name="sparkles" className="w-4 h-4 text-[#B9A8F5]" />
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowReportModal(true)}
                        className="p-2 rounded-lg text-[#777580] hover:text-[#FF6257] hover:bg-[#FF6257]/10 transition-colors"
                        title="Report User"
                      >
                        <Icon name="flag" className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h1 className="text-xl font-black text-[#F6F2EA] font-display">
                    {profile.fullName}
                  </h1>
                  {memberSince && (
                    <p className="text-xs text-[#777580]">Member since {memberSince}</p>
                  )}
                </div>

                {profile.profile?.bio ? (
                  <p className="text-sm text-[#777580] max-w-xl leading-relaxed">
                    {profile.profile.bio}
                  </p>
                ) : (
                  <p className="text-xs italic text-[#777580]">
                    This member has not written a bio yet.
                  </p>
                )}

                {/* Follower / Following Metrics Bar */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-[#2D2938] text-xs">
                  <button
                    type="button"
                    onClick={handleOpenFollowers}
                    className="flex items-center gap-1.5 text-[#777580] hover:text-[#FF6257] transition-colors cursor-pointer group py-1"
                    title="View followers"
                  >
                    <span className="font-bold text-[#F6F2EA] text-sm group-hover:text-[#FF6257] font-display">
                      {profile.followersCount ?? 0}
                    </span>
                    <span>Followers</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenFollowing}
                    className="flex items-center gap-1.5 text-[#777580] hover:text-[#FF6257] transition-colors cursor-pointer group py-1"
                    title="View following"
                  >
                    <span className="font-bold text-[#F6F2EA] text-sm group-hover:text-[#FF6257] font-display">
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
            <h2 className="text-sm font-bold text-[#F6F2EA] font-display">
              Posts by {profile.fullName} ({posts.length})
            </h2>

            {profile.isPrivate && !profile.isFollowing && !isOwnProfile ? (
              <div className="p-8 rounded-2xl bg-[#1E1B26] border border-[#2D2938] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FF6257]/15 text-[#FF6257] flex items-center justify-center mx-auto">
                  <Icon name="lock" className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#F6F2EA] font-display">This Account is Private</h3>
                <p className="text-xs text-[#777580] max-w-sm mx-auto">
                  Follow {profile.fullName} to view their photos, posts, and community activity.
                </p>
              </div>
            ) : postsError ? (
              <div className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
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

          {/* Safety Report Modal */}
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            targetType="user"
            targetId={userId}
            targetName={profile.fullName}
          />
        </>
      )}
    </div>
  );
}
