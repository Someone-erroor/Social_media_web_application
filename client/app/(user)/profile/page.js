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
        <div className="p-4 rounded-xl bg-[#FF6F61]/10 border border-[#FF6F61]/30 text-xs text-[#FF6F61] flex items-center justify-between gap-3">
          <span>{profileError}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setLoading(true);
              setProfileError('');
              setReloadTrigger((n) => n + 1);
            }}
            className="text-xs text-[#FF6F61] hover:bg-[#FF6F61]/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Profile Header Card */}
      <Card className="overflow-hidden border-[#263640] bg-[#151F29] shadow-lg shadow-black/40">
        <div className="h-28 bg-gradient-to-r from-[#19D3E3]/80 via-[#101A22] to-[#FF6F61]/80" />

        <CardContent className="relative pt-0 pb-6 px-6">
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="rounded-full ring-4 ring-[#101A22] bg-[#101A22]">
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
                <h1 className="text-xl font-bold text-[#F4F8FA]">
                  {profile?.fullName || 'Creator'}
                </h1>
                <Badge variant={profile?.role === 'admin' ? 'danger' : 'primary'}>
                  {profile?.role === 'admin' ? 'Admin' : 'Member'}
                </Badge>
              </div>
              <p className="text-xs text-[#9BAAB4]">{profile?.email}</p>
            </div>

            <p className="text-sm text-[#9BAAB4] max-w-xl">
              {profile?.profile?.bio ? (
                profile.profile.bio
              ) : (
                <span className="italic text-[#9BAAB4]">
                  No bio added yet.{' '}
                  <Link href={ROUTES.USER.PROFILE_EDIT} className="text-[#19D3E3] underline">
                    Add a bio
                  </Link>
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#9BAAB4] pt-1">
              <span className="flex items-center gap-1.5">
                <Icon name="calendar" className="w-3.5 h-3.5 text-[#9BAAB4]" />
                Joined {memberSince}
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="mail" className="w-3.5 h-3.5 text-[#9BAAB4]" />
                {profile?.isEmailVerified ? (
                  <span className="text-emerald-400 font-medium">Email Verified</span>
                ) : (
                  <Link href={ROUTES.PUBLIC.VERIFY_EMAIL} className="text-amber-400 hover:underline">
                    Unverified (Verify now)
                  </Link>
                )}
              </span>
            </div>

            {/* Follower / Following Metrics Bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-[#263640] text-xs">
              <button
                type="button"
                onClick={handleOpenFollowers}
                className="flex items-center gap-1.5 text-[#9BAAB4] hover:text-[#19D3E3] transition-colors cursor-pointer group py-1"
                title="View your followers"
              >
                <span className="font-bold text-[#F4F8FA] text-sm group-hover:text-[#19D3E3]">
                  {profile?.followersCount ?? 0}
                </span>
                <span>Followers</span>
              </button>

              <button
                type="button"
                onClick={handleOpenFollowing}
                className="flex items-center gap-1.5 text-[#9BAAB4] hover:text-[#19D3E3] transition-colors cursor-pointer group py-1"
                title="View who you are following"
              >
                <span className="font-bold text-[#F4F8FA] text-sm group-hover:text-[#19D3E3]">
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
        <h2 className="text-sm font-semibold text-[#F4F8FA]">
          Your Posts ({posts.length})
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-[#151F29] border border-[#263640] shadow-xs space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1D2A35]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-28 h-3.5 bg-[#1D2A35] rounded" />
                    <div className="w-16 h-2.5 bg-[#1D2A35]/60 rounded" />
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="w-full h-3 bg-[#1D2A35] rounded" />
                  <div className="w-4/5 h-3 bg-[#1D2A35]/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : postsError ? (
          <div className="p-4 rounded-xl bg-[#FF6F61]/10 border border-[#FF6F61]/30 text-xs text-[#FF6F61]">
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
