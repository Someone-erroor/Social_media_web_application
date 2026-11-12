'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import PostCard from '@/components/posts/PostCard';
import UserListModal from '@/components/profile/UserListModal';
import { useAuth } from '@/context/AuthContext';
import { profileService } from '@/services/profileService';
import { postService } from '@/services/postService';
import { ROUTES } from '@/lib/routes';

export default function ProfilePage() {
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState(authUser || null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [postsError, setPostsError] = useState('');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Content tabs: 'all' | 'splitReality'
  const [activeTab, setActiveTab] = useState('all');

  // User list modal state (Followers / Following)
  const [userListModalOpen, setUserListModalOpen] = useState(false);
  const [userListType, setUserListType] = useState('followers');
  const [userListUsers, setUserListUsers] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const profilePromise = profileService
      .getMyProfile()
      .then((res) => {
        if (!ignore && res?.user) {
          setProfile(res.user);
          setProfileError('');
        }
      })
      .catch((err) => {
        if (!ignore) {
          setProfileError(err.message || 'Failed to load fresh profile details.');
        }
      });

    const postsPromise = postService
      .getMyPosts({ page: 1, limit: 30 })
      .then((res) => {
        if (!ignore) {
          setPosts(res?.posts || []);
          setPostsError('');
        }
      })
      .catch((err) => {
        if (!ignore) {
          setPostsError(err.message || 'Failed to load publications.');
        }
      });

    Promise.allSettled([profilePromise, postsPromise]).finally(() => {
      if (!ignore) {
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [authUser, reloadTrigger]);

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleOpenFollowers = async () => {
    const currentId = profile?._id || authUser?._id;
    if (!currentId) return;
    setUserListType('followers');
    setUserListModalOpen(true);
    setUserListLoading(true);
    try {
      const res = await profileService.getFollowers(currentId);
      setUserListUsers(res?.followers || []);
    } catch {
      setUserListUsers([]);
    } finally {
      setUserListLoading(false);
    }
  };

  const handleOpenFollowing = async () => {
    const currentId = profile?._id || authUser?._id;
    if (!currentId) return;
    setUserListType('following');
    setUserListModalOpen(true);
    setUserListLoading(true);
    try {
      const res = await profileService.getFollowing(currentId);
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
    : 'Recently';

  const userHandle = profile?.email
    ? `@${profile.email.split('@')[0]}`
    : '@creator';

  const followersCount = profile?.followersCount ?? profile?.followers?.length ?? 0;
  const followingCount = profile?.followingCount ?? profile?.following?.length ?? 0;

  // Filter posts based on active tab
  const splitRealityPosts = posts.filter(
    (p) => p.postType === 'splitReality' || p.isSplitReality || (p.primaryMedia && p.realityMedia)
  );
  const displayedPosts = activeTab === 'splitReality' ? splitRealityPosts : posts;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal identity, dual-perspective stories, and publication history on Looply"
        action={
          <Button
            href={ROUTES.USER.PROFILE_EDIT}
            variant="outline"
            size="sm"
            icon={<Icon name="edit" className="w-4 h-4" />}
          >
            Edit Profile
          </Button>
        }
      />

      {profileError && (
        <div className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257] flex items-center justify-between gap-3">
          <span>{profileError}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setLoading(true);
              setProfileError('');
              setReloadTrigger((n) => n + 1);
            }}
            className="text-xs text-[#FF6257] hover:bg-[#FF6257]/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Profile Header Card */}
      <Card className="overflow-hidden border-[#2D2938] bg-[#1E1B26] shadow-xl shadow-black/50">
        <div className="h-32 sm:h-36 bg-gradient-to-r from-[#FF6257]/80 via-[#17151D] to-[#B9A8F5]/80 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#D5F36A_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        </div>

        <CardContent className="relative pt-0 pb-6 px-4 sm:px-6">
          <div className="-mt-14 mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="rounded-full ring-4 ring-[#1E1B26] bg-[#17151D] p-0.5">
              <Avatar
                name={profile?.fullName || 'Creator'}
                src={profile?.profile?.avatarUrl}
                size="xl"
                status="online"
              />
            </div>

            <Button
              href={ROUTES.USER.PROFILE_EDIT}
              variant="outline"
              size="sm"
              icon={<Icon name="edit" className="w-3.5 h-3.5" />}
              className="mt-2"
            >
              Edit Profile
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#F6F2EA] font-display">
                  {profile?.fullName || 'Creator'}
                </h1>
                <Badge variant={profile?.role === 'admin' ? 'coral' : 'lime'}>
                  {profile?.role === 'admin' ? 'Admin' : 'Creator'}
                </Badge>
              </div>
              <p className="text-xs text-[#777580] font-mono mt-0.5">{userHandle}</p>
            </div>

            <p className="text-sm text-[#F6F2EA]/90 max-w-2xl leading-relaxed">
              {profile?.profile?.bio ? (
                profile.profile.bio
              ) : (
                <span className="italic text-[#777580]">
                  No bio added yet.{' '}
                  <Link href={ROUTES.USER.PROFILE_EDIT} className="text-[#FF6257] hover:underline font-medium">
                    Add a bio to introduce yourself
                  </Link>
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#777580] pt-1">
              <span className="flex items-center gap-1.5">
                <Icon name="calendar" className="w-3.5 h-3.5 text-[#777580]" />
                Member since {memberSince}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="mail" className="w-3.5 h-3.5 text-[#777580]" />
                {profile?.isEmailVerified ? (
                  <span className="text-[#D5F36A] font-semibold">Email Verified</span>
                ) : (
                  <Link href={ROUTES.PUBLIC.VERIFY_EMAIL} className="text-[#FBBF24] hover:underline font-medium">
                    Unverified (Verify now)
                  </Link>
                )}
              </span>
            </div>

            {/* Follower / Following Metrics Bar */}
            <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-[#2D2938] text-xs">
              <button
                type="button"
                onClick={handleOpenFollowers}
                className="flex items-center gap-2 text-[#777580] hover:text-[#FF6257] transition-colors cursor-pointer group py-1"
                title="View your followers"
              >
                <span className="font-bold text-[#F6F2EA] text-base group-hover:text-[#FF6257] font-display">
                  {followersCount}
                </span>
                <span className="font-medium">Followers</span>
              </button>

              <button
                type="button"
                onClick={handleOpenFollowing}
                className="flex items-center gap-2 text-[#777580] hover:text-[#FF6257] transition-colors cursor-pointer group py-1"
                title="View who you are following"
              >
                <span className="font-bold text-[#F6F2EA] text-base group-hover:text-[#FF6257] font-display">
                  {followingCount}
                </span>
                <span className="font-medium">Following</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publications Section with Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#2D2938] pb-3 gap-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-[#FF6257] text-[#17151D] shadow-sm'
                  : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
              }`}
            >
              <span>All Posts</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'all' ? 'bg-[#17151D] text-[#FF6257]' : 'bg-[#24202E] text-[#777580]'
              }`}>
                {posts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('splitReality')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 ${
                activeTab === 'splitReality'
                  ? 'bg-[#FF6257] text-[#17151D] shadow-sm'
                  : 'text-[#777580] hover:text-[#F6F2EA] hover:bg-[#1E1B26]'
              }`}
            >
              <Icon name="split" className="w-3 h-3" />
              <span>Split-Reality</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'splitReality' ? 'bg-[#17151D] text-[#FF6257]' : 'bg-[#24202E] text-[#777580]'
              }`}>
                {splitRealityPosts.length}
              </span>
            </button>
          </div>

          <span className="text-xs text-[#777580] hidden sm:inline font-mono">
            {displayedPosts.length} publication{displayedPosts.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#1E1B26] border border-[#2D2938] shadow-sm space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#24202E]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-28 h-3.5 bg-[#24202E]" />
                    <div className="w-16 h-2.5 bg-[#24202E]/60 rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="w-full h-3 bg-[#24202E] rounded" />
                  <div className="w-4/5 h-3 bg-[#24202E]/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : postsError ? (
          <div className="p-4 rounded-xl bg-[#FF6257]/10 border border-[#FF6257]/30 text-xs text-[#FF6257]">
            {postsError}
          </div>
        ) : displayedPosts.length === 0 ? (
          activeTab === 'splitReality' ? (
            <EmptyState
              icon="split"
              title="No Split-Reality Posts Yet"
              description="Split-Reality posts capture two connected perspectives: The Final and Behind the Reality. Publish your first dual-perspective story from the Feed!"
              action={
                <Button href={ROUTES.USER.FEED} variant="primary" size="sm">
                  Create Split-Reality Post
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="posts"
              title="No Publications Yet"
              description="You have not published any posts on Looply yet. Share your thoughts or dual-perspective stories with the community from the Feed!"
              action={
                <Button href={ROUTES.USER.FEED} variant="primary" size="sm">
                  Go to Feed
                </Button>
              }
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
      </div>

      {/* Followers / Following List Modal */}
      <UserListModal
        isOpen={userListModalOpen}
        onClose={() => setUserListModalOpen(false)}
        type={userListType}
        users={userListUsers}
        loading={userListLoading}
        profileName={profile?.fullName || 'You'}
      />
    </div>
  );
}
