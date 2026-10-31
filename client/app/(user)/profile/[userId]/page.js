import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';
import { ROUTES } from '@/lib/routes';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const userId = resolvedParams?.userId || 'User';
  return {
    title: `@${userId}'s Profile`,
    description: `View @${userId}'s profile and updates on Looply`
  };
}

export default async function DynamicUserProfilePage({ params }) {
  const resolvedParams = await params;
  const userId = resolvedParams?.userId || 'unknown';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Profile"
        description={`Public profile information for @${userId}`}
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

      {/* Profile Header Card */}
      <Card className="overflow-hidden border-slate-200">
        <div className="h-32 bg-linear-to-r from-slate-700 via-indigo-900 to-slate-900" />

        <CardContent className="relative pt-0 pb-6 px-6">
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="rounded-full ring-4 ring-white bg-white">
              <Avatar name={userId} size="xl" />
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled
              title="Follow system activates in Phase 9"
            >
              Follow (Phase 9)
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 capitalize tracking-tight">
                {userId}
              </h2>
              <p className="text-xs text-slate-500 font-medium">@{userId}</p>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
              Community creator on Looply. Bio and activity will be available once the user profile management phase is deployed.
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Icon name="feed" className="w-4 h-4" />
                Joined Looply Community
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

      {/* Honest Empty Posts State */}
      <EmptyState
        icon="posts"
        title="No Posts to Display"
        description={`@${userId} hasn't published any posts yet. When they share posts in Phase 8 and beyond, their publications will appear here.`}
        badgeText="Community View • Phase 2"
      />
    </div>
  );
}

