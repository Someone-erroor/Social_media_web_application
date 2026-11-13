'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
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

  // Content tabs: 'all' | 'splitReality'
  const [activeTab, setActiveTab] = useState('all');

  // User list modal state (Followers / Following)
  const [userListModalOpen, setUserListModalOpen] = useState(false);
  const [userListType, setUserListType] = useState('followers');
  const [userListUsers, setUserListUsers] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const isOwnProfile = Boolean(
    currentUser &&
    (currentUser._id === userId || currentUser.id === userId || profile?.isOwnProfile)
  );

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
        .getUserPosts(userId, { page: 1, limit: 30 })
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

  // Filter posts based on active tab
  const splitRealityPosts = posts.filter(
    (p) => p.postType === 'splitReality' || p.isSplitReality || (p.primaryMedia && p.realityMedia)
  );
  const displayedPosts = activeTab === 'splitReality' ? splitRealityPosts : posts;

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile ? profile.fullName : 'Profile'}
        description={
          profile
            ? `Explore ${profile.fullName}'s presence, dual-perspective stories, and thoughts on Looply`
            : 'Viewing member profile on Looply'
        }
      />

      {loading ? (
        <Card className="overflow-hidden border-[#E7E5E0] bg-white animate-pulse shadow-xs">
          <div className="h-32 bg-[#F1F0EC]" />
          <CardContent className="pt-0 pb-6 px-6">
            <div className="-mt-14 mb-4 w-24 h-24 rounded-full bg-[#F1F0EC] ring-4 ring-white" />
            <div className="space-y-2">
              <div className="w-48 h-5 bg-[#F1F0EC] rounded" />
              <div className="w-64 h-3 bg-[#F1F0EC]/60 rounded" />
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
          <Card className="overflow-hidden border-[#E7E5E0] bg-white shadow-xs">
            <div className="h-32 sm:h-36 bg-gradient-to-r from-[#6C63FF]/30 via-[#EEEAFE] to-[#FFD166]/40 relative">
              <div className="absolute inset-0 bg-[radial-gradient(#6C63FF_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
            </div>

            <CardContent className="relative pt-0 pb-6 px-4 sm:px-6">
              <div className="-mt-14 mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="rounded-full ring-4 ring-white bg-white p-0.5 shadow-xs">
                  <Avatar
                    name={profile.fullName}
                    src={profile.profile?.avatarUrl}
                    size="xl"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {isOwnProfile ? (
                    <Button
                      href={ROUTES.USER.PROFILE_EDIT}
                      variant="outline"
                      size="sm"
                      icon={<Icon name="edit" className="w-3.5 h-3.5" />}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <>
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
                        className="px-2 text-[#6C63FF] hover:bg-[#EEEAFE]"
                        title="Friendship Memories"
                      >
                        <Icon name="sparkles" className="w-4 h-4 text-[#6C63FF]" />
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowReportModal(true)}
                        className="p-2 rounded-lg text-[#6B6B73] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors cursor-pointer"
                        title="Report User"
                      >
                        <Icon name="flag" className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-[#1E1E24]">
                      {profile.fullName}
                    </h1>
                    {profile.isPrivate && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F1F0EC] text-[#6B6B73] border border-[#E7E5E0]">
                        <Icon name="lock" className="w-2.5 h-2.5" />
                        Private
                      </span>
                    )}
                  </div>
                  {memberSince && (
                    <p className="text-xs text-[#6B6B73] mt-0.5">Member since {memberSince}</p>
                  )}
                </div>

                {profile.profile?.bio ? (
                  <p className="text-sm text-[#1E1E24] max-w-2xl leading-relaxed">
                    {profile.profile.bio}
                  </p>
                ) : (
                  <p className="text-xs italic text-[#6B6B73]">
                    This member has not written a bio yet.
                  </p>
                )}

                {/* Follower / Following Metrics Bar */}
                <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-[#E7E5E0] text-xs">
                  <button
                    type="button"
                    onClick={handleOpenFollowers}
                    className="flex items-center gap-2 text-[#6B6B73] hover:text-[#6C63FF] transition-colors cursor-pointer group py-1"
                    title="View followers"
                  >
                    <span className="font-bold text-[#1E1E24] text-base group-hover:text-[#6C63FF]">
                      {profile.followersCount ?? 0}
                    </span>
                    <span className="font-medium">Followers</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenFollowing}
                    className="flex items-center gap-2 text-[#6B6B73] hover:text-[#6C63FF] transition-colors cursor-pointer group py-1"
                    title="View following"
                  >
                    <span className="font-bold text-[#1E1E24] text-base group-hover:text-[#6C63FF]">
                      {profile.followingCount ?? 0}
                    </span>
                    <span className="font-medium">Following</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Posts Section */}
          <div className="space-y-4">
            {profile.isPrivate && !profile.isFollowing && !isOwnProfile ? (
              <div className="p-10 rounded-2xl bg-white border border-[#E7E5E0] text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-[#FFEAEA] text-[#FF6B6B] flex items-center justify-center mx-auto">
                  <Icon name="lock" className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#1E1E24]">This Account is Private</h3>
                  <p className="text-xs text-[#6B6B73] max-w-md mx-auto leading-relaxed">
                    Follow {profile.fullName} to see their photos, dual-perspective Split-Reality posts, and activity on Looply.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Content Tabs */}
                <div className="flex items-center justify-between border-b border-[#E7E5E0] pb-3 gap-3 overflow-x-auto">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'all'
                          ? 'bg-[#6C63FF] text-white shadow-xs font-bold'
                          : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-white'
                      }`}
                    >
                      <span>All Posts</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-[#F1F0EC] text-[#6B6B73]'
                      }`}>
                        {posts.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('splitReality')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                        activeTab === 'splitReality'
                          ? 'bg-[#6C63FF] text-white shadow-xs font-bold'
                          : 'text-[#6B6B73] hover:text-[#1E1E24] hover:bg-white'
                      }`}
                    >
                      <Icon name="split" className="w-3 h-3" />
                      <span>Split-Reality</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        activeTab === 'splitReality' ? 'bg-white/20 text-white' : 'bg-[#F1F0EC] text-[#6B6B73]'
                      }`}>
                        {splitRealityPosts.length}
                      </span>
                    </button>
                  </div>

                  <span className="text-xs text-[#6B6B73] hidden sm:inline font-medium">
                    {displayedPosts.length} publication{displayedPosts.length === 1 ? '' : 's'}
                  </span>
                </div>

                {postsError ? (
                  <div className="p-4 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-xs text-[#FF6B6B] font-medium">
                    {postsError}
                  </div>
                ) : displayedPosts.length === 0 ? (
                  activeTab === 'splitReality' ? (
                    <EmptyState
                      icon="split"
                      title="No Split-Reality Posts"
                      description={`${profile.fullName} has not shared any Split-Reality dual-perspective posts yet.`}
                    />
                  ) : (
                    <EmptyState
                      icon="posts"
                      title="No Publications Yet"
                      description={`${profile.fullName} has not published any posts on Looply yet.`}
                    />
                  )
                ) : (
                  <div className="space-y-4">
                    {displayedPosts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onPostUpdated={handlePostUpdated}
                        onPostDeleted={handlePostDeleted}
                      />
                    ))}
                  </div>
                )}
              </>
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
