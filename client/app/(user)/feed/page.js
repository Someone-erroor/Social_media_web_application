import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
  title: 'Home Feed',
  description: 'View recent updates and community posts'
};

export default function FeedPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Home Feed"
        description="The latest thoughts and discussions from creators across Looply"
      />

      {/* Post Composer Teaser */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Avatar name="Guest User" size="md" status="online" />
            <div className="flex-1 min-w-0">
              <textarea
                placeholder="What is happening? Share your thoughts..."
                rows={3}
                disabled
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 text-slate-400">
              <button
                type="button"
                disabled
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                title="Add media (Phase 8)"
              >
                <Icon name="posts" className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                title="AI Assist (Phase 14)"
              >
                <Icon name="sparkles" className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-slate-400 italic">
                Composer disabled in Phase 2
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled
              title="Post creation activates in Phase 8"
            >
              Post (Phase 8)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed Filter Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs"
        >
          For You
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Following
        </button>
      </div>

      {/* Honest Empty Feed State */}
      <EmptyState
        icon="feed"
        title="Your Feed is Empty"
        description="No posts have been published yet. Once the community begins sharing content in Phase 8, posts and discussion loops will populate here in chronological order."
        badgeText="Feed Ready • Phase 2"
      />
    </div>
  );
}

