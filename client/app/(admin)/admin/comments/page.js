import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = {
  title: 'Comment Moderation | Admin',
  description: 'Moderate discussion replies and comment threads'
};

export default function AdminCommentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Comment Moderation"
        description="Inspect reported comments, reply chains, and discussion conduct"
      />

      {/* Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs"
        >
          All Comments (0)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Reported (0)
        </button>
        <button
          type="button"
          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          Hidden (0)
        </button>
      </div>

      {/* Honest Empty Comments State */}
      <EmptyState
        icon="comments"
        title="No Comments for Moderation"
        description="No user comments have been reported. Discussion replies and flagged comments will appear here for review."
        badgeText="Moderation Queue"
      />
    </div>
  );
}

