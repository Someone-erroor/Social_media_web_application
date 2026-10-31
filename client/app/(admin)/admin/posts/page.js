import PageHeader from '@/components/ui/PageHeader';
import Card, { CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
  title: 'Post Moderation | Admin',
  description: 'Moderate community posts and flag reports'
};

export default function AdminPostsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Post Moderation"
        description="Review community content reports, flagged publications, and enforce standards"
      />

      {/* Moderation Status Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs"
        >
          All Posts (0)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Flagged (0)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Under Review (0)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Archived (0)
        </button>
      </div>

      {/* Honest Empty Moderation State */}
      <EmptyState
        icon="posts"
        title="No Posts Awaiting Moderation"
        description="There are currently no community posts or flag reports in the queue. Content published in Phase 8 and reported by users in Phase 12 will appear here."
        badgeText="Moderation Queue Clean • Phase 2"
      />
    </div>
  );
}

