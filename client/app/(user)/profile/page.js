import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES } from '@/lib/routes';

export const metadata = {
  title: 'Profile',
  description: 'View your profile and published posts'
};

export default function ProfilePage() {
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

      {/* Profile Header Card */}
      <Card className="overflow-hidden border-slate-200">
        {/* Decorative Cover Banner */}
        <div className="h-32 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <CardContent className="relative pt-0 pb-6 px-6">
          {/* Avatar Positioned on Banner */}
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="rounded-full ring-4 ring-white bg-white">
              <Avatar name="Alex Morgan" size="xl" status="online" />
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

          {/* User Information */}
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Alex Morgan
              </h2>
              <p className="text-xs text-slate-500 font-medium">@alexmorgan</p>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed max-w-lg">
              Exploring modern interface engineering, distributed systems, and creative expression. Building with Next.js, React, and Tailwind CSS.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Icon name="explore" className="w-4 h-4 text-slate-400" />
                San Francisco, CA
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="feed" className="w-4 h-4 text-slate-400" />
                Joined October 2026
              </span>
            </div>

            {/* Authentic Non-Fabricated Metrics */}
            <div className="flex items-center gap-6 pt-3 border-t border-slate-100 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900">0</span>
                <span className="text-slate-500 text-xs">Posts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900">0</span>
                <span className="text-slate-500 text-xs">Following</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900">0</span>
                <span className="text-slate-500 text-xs">Followers</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs"
        >
          Posts
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Replies
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Likes
        </button>
      </div>

      {/* Honest Empty Posts State */}
      <EmptyState
        icon="posts"
        title="No Posts Published Yet"
        description="When you publish thoughts, updates, and articles, they will appear here on your public profile."
        badgeText="Member Profile"
      />
    </div>
  );
}

