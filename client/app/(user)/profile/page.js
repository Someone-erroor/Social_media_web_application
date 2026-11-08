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
      .getMyPosts({ page: 1, limit: 20 })
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal presence and publication history on Looply"
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
        <div className="h-28 bg-gradient-to-r from-[#FF6257]/80 via-[#17151D] to-[#B9A8F5]/80" />

        <CardContent className="relative pt-0 pb-6 px-6">
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="rounded-full ring-4 ring-[#17151D] bg-[#17151D]">
              <Avatar
                name={profile?.fullName || 'User'}
                src={profile?.profile?.avatarUrl}
                size="xl"
                status="online"
              />
            </div>

            <Button
              href={ROUTES.USER.PROFILE_EDIT}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Edit Profile
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#F6F2EA] font-display">
                  {profile?.fullName || 'Creator'}
                </h1>
                <Badge variant={profile?.role === 'admin' ? 'coral' : 'lime'}>
                  {profile?.role === 'admin' ? 'Admin' : 'Member'}
                </Badge>
              </div>
              <p className="text-xs text-[#777580] font-mono">{profile?.email}</p>
            </div>

            <p className="text-sm text-[#777580] max-w-xl">
              {profile?.profile?.bio ? (
                profile.profile.bio
              ) : (
                <span className="italic text-[#777580]">
                  No bio added yet.{' '}
                  <Link href={ROUTES.USER.PROFILE_EDIT} className="text-[#FF6257] underline">
                    Add a bio
                  </Link>
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#777580] pt-1">
              <span className="flex items-center gap-1.5">
                <Icon name="calendar" className="w-3.5 h-3.5 text-[#777580]" />
                Joined {memberSince}
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
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-[#2D2938] text-xs">
              <button
                type="button"
                onClick={handleOpenFollowers}
                className="flex items-center gap-1.5 text-[#777580] hover:text-[#FF6257] transition-colors cursor-pointer group py-1"
                title="View your followers"
              >
                <span className="font-bold text-[#F6F2EA] text-sm group-hover:text-[#FF6257] font-display">
                  {profile?.followersCount ?? 0}
                </span>
                <span>Followers</span>
              </button>

              <button
                type="button"
                onClick={handleOpenFollowing}
                className="flex items-center gap-1.5 text-[#777580] hover:text-[#FF6257] transition-colors cursor-pointer group py-1"
                title="View who you are following"
              >
                <span className="font-bold text-[#F6F2EA] text-sm group-hover:text-[#FF6257] font-display">
                  {profile?.followingCount ?? 0}
                </span>
                <span>Following</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publications Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#F6F2EA] font-display">
          Your Posts ({posts.length})
        </h2>

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
        ) : posts.length === 0 ? (
          <EmptyState
            icon="posts"
            title="No Publications Yet"
            description="You have not published any posts on Looply yet. Share your thoughts with the community from the Feed!"
            action={
              <Button href={ROUTES.USER.FEED} variant="primary" size="sm">
                Go to Feed
              </Button>
            }
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
        profileName={profile?.fullName || 'You'}
      />
    </div>
  );
}
